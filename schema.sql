-- tec-ec-election/schema.sql

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS ballot_selections;
DROP TABLE IF EXISTS ballots;
DROP TABLE IF EXISTS voter_participation;
DROP TABLE IF EXISTS voter_roll;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS elections;

CREATE TABLE elections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, open, closed, finalized
    voting_window_start DATETIME,
    voting_window_end DATETIME,
    panel_size INTEGER NOT NULL DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidates (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL REFERENCES elections(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voter_roll (
    email TEXT NOT NULL,
    election_id TEXT NOT NULL REFERENCES elections(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(email, election_id)
);

CREATE TABLE voter_participation (
    email TEXT NOT NULL,
    election_id TEXT NOT NULL REFERENCES elections(id),
    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(email, election_id)
);

CREATE TABLE ballots (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL REFERENCES elections(id),
    ballot_hash TEXT NOT NULL UNIQUE,
    previous_hash TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ballot_selections (
    ballot_id TEXT NOT NULL REFERENCES ballots(id),
    candidate_id TEXT NOT NULL REFERENCES candidates(id),
    PRIMARY KEY(ballot_id, candidate_id)
);

CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
