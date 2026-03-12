import { Router, error, json } from 'itty-router';
import { Env } from '../index';
import { AuthenticatedRequest, requireAdmin } from './middleware';
import { DBWrapper } from '../db';
import { Candidate } from '../db/models';

export const candidatesRouter = Router<AuthenticatedRequest, [Env, ExecutionContext]>({ base: '/api/elections/:id/candidates' });

candidatesRouter.all('/*', requireAdmin);

// GET /api/elections/:id/candidates
candidatesRouter.get('/', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const candidates = await db.getCandidates(req.params.id);
  return json({ candidates });
});

// POST /api/elections/:id/candidates
candidatesRouter.post('/', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'draft') return error(400, 'Cannot add candidates unless election is in draft');

  const body: any = await req.json().catch(() => ({}));
  if (!body.name) return error(400, 'Candidate name is required');

  const candidateId = crypto.randomUUID();
  const candidate: Candidate = {
    id: candidateId,
    election_id: election.id,
    name: body.name,
    description: body.description || null,
    created_at: new Date().toISOString()
  };

  await env.DB.prepare(
    'INSERT INTO candidates (id, election_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(candidate.id, candidate.election_id, candidate.name, candidate.description, candidate.created_at).run();

  await db.logAudit(election.id, 'CANDIDATE_ADDED', { candidate_id: candidate.id, name: candidate.name });

  return json({ success: true, candidate });
});

// DELETE /api/elections/:id/candidates/:candidateId
candidatesRouter.delete('/:candidateId', async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'draft') return error(400, 'Cannot remove candidates unless election is in draft');

  const res = await env.DB.prepare('DELETE FROM candidates WHERE id = ? AND election_id = ?').bind(req.params.candidateId, election.id).run();
  
  if (res.meta.changes > 0) {
    await db.logAudit(election.id, 'CANDIDATE_REMOVED', { candidate_id: req.params.candidateId });
  }

  return json({ success: true });
});
