import { Router, error, json, IRequest } from 'itty-router';
import { Env } from '../index';
import { DBWrapper } from '../db';

export const auditRouter = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/audit' });

// GET /api/audit/:electionId - Public audit log
auditRouter.get('/:electionId', async (req, env) => {
  const db = new DBWrapper(env.DB);
  // Optional: Verify election exists
  const election = await db.getElection(req.params.electionId);
  if (!election) return error(404, 'Election not found');

  const res = await env.DB.prepare('SELECT * FROM audit_log WHERE election_id = ? ORDER BY timestamp DESC, id DESC LIMIT 500').bind(req.params.electionId).all();
  return json({ logs: res.results });
});
