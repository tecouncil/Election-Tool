export interface Election {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'open' | 'closed' | 'finalized';
  voting_window_start: string | null;
  voting_window_end: string | null;
  panel_size: number;
  created_at: string;
}

export interface Candidate {
  id: string;
  election_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface VoterRoll {
  email: string;
  election_id: string;
  created_at: string;
}

export interface VoterParticipation {
  email: string;
  election_id: string;
  voted_at: string;
}

export interface Ballot {
  id: string;
  election_id: string;
  ballot_hash: string;
  previous_hash: string;
  timestamp: string;
}

export interface BallotSelection {
  ballot_id: string;
  candidate_id: string;
}

export interface AuditLog {
  id: string;
  election_id: string;
  action: string;
  details: string | null;
  timestamp: string;
}
