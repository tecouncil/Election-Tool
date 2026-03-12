import { Router, error, json } from 'itty-router';
import { Env } from '../index';
import { AuthenticatedRequest, requireVoter } from './middleware';
import { DBWrapper } from '../db';
import { computeBallotHash } from '../utils/crypto';
import { sendEmail } from '../utils/email';
import { formatDateIST } from '../utils/datetime';

export const ballotsRouter = Router<AuthenticatedRequest, [Env, ExecutionContext]>({ base: '/api/elections/:id' });

// POST /api/elections/:id/ballots
// Submits a ballot
ballotsRouter.post('/ballots', requireVoter, async (req, env, ctx) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'open') return error(400, 'Election is not open');

  const now = new Date().toISOString();
  if (election.voting_window_start && now < election.voting_window_start) {
    return error(400, 'Election has not started yet');
  }
  if (election.voting_window_end && now > election.voting_window_end) {
    return error(400, 'Election has already ended');
  }

  const email = req.session?.email;
  if (!email) return error(401, 'Unknown voter session');

  // Ensure voter is on roll (If "Anyone with link can vote", we might add them on the fly
  // But requirement says: "If their email is on the voter roll... receive OTP".
  // Let's assume they must be on the roll or open access allows them to vote.
  // The latest requirement says: "Anyone with the link can enter their email... to vote"
  // So we insert them into participation!
  
  const hasVoted = await db.hasVoted(email, election.id);
  if (hasVoted) return error(400, 'Voter has already cast a ballot');

  const body: any = await req.json().catch(() => ({}));
  const selections: string[] = body.selections || [];

  if (!Array.isArray(selections) || selections.length !== election.panel_size) {
    return error(400, `Exactly ${election.panel_size} selections required`);
  }

  // Verify candidate IDs are valid
  const candidates = await db.getCandidates(election.id);
  const candidateIds = candidates.map(c => c.id);
  const validSelections = selections.every(sel => candidateIds.includes(sel));
  if (!validSelections) return error(400, 'Invalid candidate selections');
  if (new Set(selections).size !== selections.length) return error(400, 'Duplicate selections not allowed');

  // Compute ballot hash chain
  const latestBallot = await db.getLatestBallot(election.id);
  const previousHash = latestBallot ? latestBallot.ballot_hash : 'genesis';
  
  
  const timestamp = new Date().toISOString();
  
  // Hash formula: SHA-256(sorted_selections + "|" + previous_hash + "|" + timestamp)
  const ballotHash = await computeBallotHash(selections, previousHash, timestamp);

  const ballotId = crypto.randomUUID();

  const success = await db.submitVote(email, election.id, ballotId, ballotHash, previousHash, selections, timestamp);
  
  if (!success) {
    return error(500, 'Failed to submit ballot');
  }

  // Send confirmation email to voter (non-blocking)
  const selectedCandidateNames = selections.map(id => 
    candidates.find(c => c.id === id)?.name || id
  );

  const emailHtml = `
    <h2>Vote Confirmation</h2>
    <p>Thank you for participating in <strong>${election.title}</strong>.</p>
    <p>Your vote has been successfully cast. To protect your privacy, your specific selections are not included in this email.</p>
    <p>You can view, download, or copy your full receipt (including your choices) on the election website confirmation page that is currently open in your browser.</p>
    <hr />
    <p><strong>Ballot Hash:</strong> ${ballotHash}</p>
    <p><strong>Timestamp:</strong> ${formatDateIST(timestamp)} (IST)</p>
    <p><em>Save this information for your records. The ballot hash allows you to verify that your vote is included in the final tally without revealing your identity.</em></p>
  `;

  ctx.waitUntil(sendEmail(env, email, `Voting Confirmation: ${election.title}`, emailHtml));

  return json({ 
    success: true, 
    receipt: { 
      ballotId, 
      ballotHash, 
      timestamp, 
      previousHash,
      selections: selectedCandidateNames
    } 
  });
});

// GET /api/elections/:id/results - Public once finalized
ballotsRouter.get('/results', async (req, env) => {
  const db = new DBWrapper(env.DB);
  const election = await db.getElection(req.params.id);
  if (!election) return error(404, 'Election not found');
  if (election.status !== 'finalized') return error(400, 'Results are not available until the election is finalized');

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
