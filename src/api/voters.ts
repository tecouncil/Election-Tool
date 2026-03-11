import { Router, error, json } from 'itty-router';
import { Env } from '../index';
import { AuthenticatedRequest, requireAdmin } from './middleware';
import { DBWrapper } from '../db';
import { VoterRoll } from '../db/models';

export const votersRouter = Router<AuthenticatedRequest, [Env, ExecutionContext]>({ base: '/api/elections/:id/voters' });

votersRouter.all('/*', requireAdmin);

// GET /api/elections/:id/voters
votersRouter.get('/', async (req, env) => {
  const db = new DBWrapper(env.DB);
  const roll = await db.getVoterRoll(req.params.id);
  return json({ roll });
});

// POST /api/elections/:id/voters
votersRouter.post('/', async (req, env) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'draft') return error(400, 'Cannot add voters unless election is in draft');

  const body: any = await req.json().catch(() => ({}));
  if (!body.email) return error(400, 'Voter email is required');

  const email = body.email.toLowerCase().trim();

  try {
    await env.DB.prepare('INSERT INTO voter_roll (email, election_id) VALUES (?, ?)')
      .bind(email, election.id).run();
      
    await db.logAudit(election.id, 'VOTER_ADDED', { email });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
       return error(400, 'Voter already exists on the roll');
    }
    return error(500, 'Database error');
  }

  return json({ success: true, email });
});

// POST /api/elections/:id/voters/import
votersRouter.post('/import', async (req, env) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'draft') return error(400, 'Cannot add voters unless election is in draft');

  const text = await req.text().catch(() => '');
  // expecting CSV format: email,Name ... or just one email per line
  // Let's just do a simple email extraction
  const emails = text.split('\n')
    .map(e => e.split(',')[0].trim().toLowerCase()) // assume email is first col
    .filter(e => e && e.includes('@'));

  if (emails.length === 0) return error(400, 'No valid emails found in import');

  // Insert all in a batch using D1 Wrapper
  const batch = [];
  for (const email of emails) {
    batch.push(
      env.DB.prepare('INSERT OR IGNORE INTO voter_roll (email, election_id) VALUES (?, ?)').bind(email, election.id)
    );
  }

  await env.DB.batch(batch);
  await db.logAudit(election.id, 'VOTERS_IMPORTED', { count: emails.length });
  
  return json({ success: true, count: emails.length });
});

// DELETE /api/elections/:id/voters/:email
votersRouter.delete('/:email', async (req, env) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'draft') return error(400, 'Cannot remove voters unless election is in draft');

  const email = decodeURIComponent(req.params.email).toLowerCase().trim();
  const res = await env.DB.prepare('DELETE FROM voter_roll WHERE email = ? AND election_id = ?').bind(email, election.id).run();
  
  if (res.meta.changes > 0) {
    await db.logAudit(election.id, 'VOTER_REMOVED', { email });
  }

  return json({ success: true });
});
