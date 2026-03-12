# Technology Entrepreneurs’ Council Election Tool

A secure, anonymous, and cryptographically verifiable election system built for the **Technology Entrepreneurs’ Council (TEC)**.

## Overview

The TEC Election Tool is designed to catalyze meaningful dialogues and collective leadership decisions within the TEC community. It provides a platform for technology leaders from Bhavnagar and across India to participate in sustainable governance through secure digital voting.

### Key Features

- **End-to-End Encryption**: Votes are encrypted at the source to ensure total anonymity.
- **Cryptographic Integrity**: A Merkle-inspired append-only ledger (Audit Log) ensures that ballots cannot be tampered with once cast.
- **Verifiable Results**: Every voter receives a digital receipt to verify their specific ballot was counted accurately.
- **Modern UI/UX**: A professional, premium interface designed for high-trust environments.
- **Automated Participation**: Live tallies and automated verification results.

## Technical Stack

- **Frontend**: Single Page Application (SPA) built with TypeScript, `itty-router`, and `esbuild`.
- **Backend**: Cloudflare Workers (Serverless Runtime).
- **Database**: 
  - **D1**: Relational storage for election configuration, candidates, and participation rosters.
  - **KV Namespace**: Distributed storage for session management and anti-fraud tokens.
- **Durable Objects**: Rate limiting and real-time state synchronization for security.
- **Email**: Integration with Resend for secure OTP delivery and cast confirmation.

## Development

### Prerequisites

- Node.js & npm
- Cloudflare Wrangler CLI

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `wrangler.toml`:
   - `ADMIN_EMAIL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`

3. Initialize local database:
   ```bash
   npx wrangler d1 execute tec-ec-election-db --local --file=./schema.sql
   ```

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Security & Ethics

- **Anonymity**: The system is architected to detach voter identity from specific ballot choices.
- **Transparency**: The complete Audit Log is publicly inspectable to verify the integrity of every election event.
- **Sustainability**: Built on energy-efficient serverless infrastructure to support the long-term growth of the TEC community.

## Links

- **Official Website**: [https://tecouncil.org/](https://tecouncil.org/)
- **Instagram**: [@tecouncil](https://www.instagram.com/tecouncil/)

---
*Built with ❤️ for the Technology Entrepreneurs’ Council.*
