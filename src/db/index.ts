import {
  Election,
  Candidate,
  VoterRoll,
  VoterParticipation,
  Ballot,
  BallotSelection,
  AuditLog
} from './models';

export class DBWrapper {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getElection(id: string): Promise<Election | null> {
    const res = await this.db.prepare('SELECT * FROM elections WHERE id = ?').bind(id).first<Election>();
    return res;
  }

  async getElections(): Promise<Election[]> {
    const res = await this.db.prepare('SELECT * FROM elections ORDER BY created_at DESC').all<Election>();
    return res.results;
  }

  async getCandidates(electionId: string): Promise<Candidate[]> {
    const res = await this.db.prepare('SELECT * FROM candidates WHERE election_id = ?').bind(electionId).all<Candidate>();
    return res.results;
  }

  async getVoterRoll(electionId: string): Promise<VoterRoll[]> {
    const res = await this.db.prepare('SELECT * FROM voter_roll WHERE election_id = ?').bind(electionId).all<VoterRoll>();
    return res.results;
  }

  async isVoterOnRoll(email: string, electionId: string): Promise<boolean> {
    const res = await this.db.prepare('SELECT 1 FROM voter_roll WHERE email = ? AND election_id = ?').bind(email, electionId).first();
    return !!res;
  }

  async hasVoted(email: string, electionId: string): Promise<boolean> {
    const res = await this.db.prepare('SELECT 1 FROM voter_participation WHERE email = ? AND election_id = ?').bind(email, electionId).first();
    return !!res;
  }

  async getLatestBallot(electionId: string): Promise<Ballot | null> {
    const res = await this.db.prepare('SELECT * FROM ballots WHERE election_id = ? ORDER BY timestamp DESC, id DESC LIMIT 1').bind(electionId).first<Ballot>();
    return res;
  }

  // Transaction to submit a ballot, mark voter as voted, and log audit event
  async submitVote(
    email: string,
    electionId: string,
    ballotId: string,
    ballotHash: string,
    previousHash: string,
    candidateIds: string[]
  ): Promise<boolean> {
    const batch = [];

    // 1. Insert participation
    batch.push(
      this.db.prepare('INSERT INTO voter_participation (email, election_id) VALUES (?, ?)')
        .bind(email, electionId)
    );

    // 2. Insert ballot
    batch.push(
      this.db.prepare('INSERT INTO ballots (id, election_id, ballot_hash, previous_hash) VALUES (?, ?, ?, ?)')
        .bind(ballotId, electionId, ballotHash, previousHash)
    );

    // 3. Insert selections
    for (const cid of candidateIds) {
      batch.push(
        this.db.prepare('INSERT INTO ballot_selections (ballot_id, candidate_id) VALUES (?, ?)')
          .bind(ballotId, cid)
      );
    }

    // 4. Audit log
    const auditId = crypto.randomUUID();
    batch.push(
      this.db.prepare('INSERT INTO audit_log (id, election_id, action, details) VALUES (?, ?, ?, ?)')
        .bind(auditId, electionId, 'VOTE_CAST', JSON.stringify({ previous_hash: previousHash }))
    );

    try {
      await this.db.batch(batch);
      return true;
    } catch (e) {
      console.error('Submit vote transaction failed', e);
      return false;
    }
  }

  async logAudit(electionId: string, action: string, details?: any): Promise<void> {
    const auditId = crypto.randomUUID();
    await this.db.prepare('INSERT INTO audit_log (id, election_id, action, details) VALUES (?, ?, ?, ?)')
      .bind(auditId, electionId, action, details ? JSON.stringify(details) : null)
      .run();
  }
}
