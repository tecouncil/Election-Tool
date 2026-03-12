import { Router, error, json, IRequest } from 'itty-router';
import { Env } from '../index';

export const verifyRouter = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/verify' });

// GET /api/verify/:ballotHash
verifyRouter.get('/:ballotHash', async (req, env, ctx) => {
  // Find a ballot by hash
  const res = await env.DB.prepare('SELECT id, election_id, previous_hash, timestamp FROM ballots WHERE ballot_hash = ?').bind(req.params.ballotHash).first();
  
  if (!res) return error(404, 'Ballot hash not found in the chain');

  return json({ ballot: res });
});
