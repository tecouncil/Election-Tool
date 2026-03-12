import { Router, error, json } from 'itty-router';
import { Env } from '../index';
import { AuthenticatedRequest, requireAdmin } from './middleware';
import { DBWrapper } from '../db';
import { Election } from '../db/models';

export const electionsRouter = Router<AuthenticatedRequest, [Env, ExecutionContext]>({ base: '/api/elections' });

// Public endpoint for voters to get election details
electionsRouter.get('/:id/public', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status === 'draft') return error(403, 'Election not started');
  
  const candidates = await db.getCandidates(election.id);
  // Strip descriptions or sensitive info if needed, but names are fine
  return json({ election, candidates });
});

// Global middleware for Admin routes below
electionsRouter.all('/*', requireAdmin);

// GET /api/elections
electionsRouter.get('/', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const elections = await db.getElections();
  return json({ elections });
});

// POST /api/elections
electionsRouter.post('/', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const body: any = await req.json().catch(() => ({}));
  
  if (!body.title) return error(400, 'Title is required');

  const electionId = crypto.randomUUID();
  const election: Election = {
    id: electionId,
    title: body.title,
    description: body.description || null,
    status: 'draft',
    voting_window_start: body.voting_window_start || null,
    voting_window_end: body.voting_window_end || null,
    panel_size: body.panel_size || 3,
    created_at: new Date().toISOString()
  };

  await env.DB.prepare(
    'INSERT INTO elections (id, title, description, status, voting_window_start, voting_window_end, panel_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    election.id, election.title, election.description, election.status,
    election.voting_window_start, election.voting_window_end,
    election.panel_size, election.created_at
  ).run();

  await db.logAudit(election.id, 'ELECTION_CREATED', { title: election.title, panel_size: election.panel_size });

  return json({ success: true, election });
});

// GET /api/elections/:id
electionsRouter.get('/:id', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  return json({ election });
});

// PATCH /api/elections/:id
electionsRouter.patch('/:id', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'draft') return error(400, 'Can only edit draft elections');

  const body: any = await req.json().catch(() => ({}));
  
  const title = body.title !== undefined ? body.title : election.title;
  const description = body.description !== undefined ? body.description : election.description;
  const panel_size = body.panel_size !== undefined ? body.panel_size : election.panel_size;
  const start = body.voting_window_start !== undefined ? body.voting_window_start : election.voting_window_start;
  const end = body.voting_window_end !== undefined ? body.voting_window_end : election.voting_window_end;

  await env.DB.prepare(
    'UPDATE elections SET title = ?, description = ?, panel_size = ?, voting_window_start = ?, voting_window_end = ? WHERE id = ?'
  ).bind(title, description, panel_size, start, end, election.id).run();

  await db.logAudit(election.id, 'ELECTION_UPDATED', body);

  return json({ success: true });
});

// POST /api/elections/:id/open
electionsRouter.post('/:id/open', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'draft') return error(400, 'Election is not in draft status');

  const candidates = await db.getCandidates(election.id);
  if (candidates.length < 5) {
    // User requested "Requires >5 candidates to open" - actually in requirement: "Requires >=5 candidates to open" -> text says "Requires ≥5 candidates to open" but then later "Admin creates election, adds candidates (≥3)". Let's assume >= 5.
    return error(400, 'At least 5 candidates required to open election');
  }

  await env.DB.prepare("UPDATE elections SET status = 'open' WHERE id = ?").bind(election.id).run();
  await db.logAudit(election.id, 'ELECTION_OPENED');

  return json({ success: true, message: 'Election opened' });
});

// POST /api/elections/:id/close
electionsRouter.post('/:id/close', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'open') return error(400, 'Election is not open');

  await env.DB.prepare("UPDATE elections SET status = 'closed' WHERE id = ?").bind(election.id).run();
  await db.logAudit(election.id, 'ELECTION_CLOSED');

  return json({ success: true, message: 'Election closed' });
});

// POST /api/elections/:id/finalize
electionsRouter.post('/:id/finalize', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'closed') return error(400, 'Election must be closed to finalize');

  await env.DB.prepare("UPDATE elections SET status = 'finalized' WHERE id = ?").bind(election.id).run();
  await db.logAudit(election.id, 'ELECTION_FINALIZED');

  return json({ success: true, message: 'Election finalized' });
});

// GET /api/elections/:id/internal-results - Admin only, available anytime
electionsRouter.get('/:id/internal-results', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');

  const candidates = await db.getCandidates(election.id);
  const query = `
    SELECT candidate_id, COUNT(*) as vote_count 
    FROM ballot_selections bs 
    JOIN ballots b ON b.id = bs.ballot_id 
    WHERE b.election_id = ? 
    GROUP BY candidate_id
  `;
  const res = await env.DB.prepare(query).bind(election.id).all();
  
  const resultsMap: Record<string, number> = {};
  for (const row of res.results) {
    resultsMap[row.candidate_id as string] = row.vote_count as number;
  }

  const results = candidates.map(c => ({
    id: c.id,
    name: c.name,
    votes: resultsMap[c.id] || 0
  })).sort((a, b) => b.votes - a.votes);

  return json({ election, results });
});

// GET /api/elections/:id/participation
electionsRouter.get('/:id/participation', async (req, env) => {
  const db = new DBWrapper(env.DB);
  // Get all participation logs for the election
  const res = await env.DB.prepare('SELECT email, voted_at FROM voter_participation WHERE election_id = ? ORDER BY voted_at DESC').bind(req.params.id).all();
  return json({ participation: res.results });
});
