import { apiFetch, renderHeader, formatDateIST } from '../utils/api';
import { router } from '../router';

export async function renderResults(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;
  app.innerHTML = `<div>Loading Results...</div>`;

  try {
    const data = await apiFetch(`/elections/${electionId}/results`);
    const election = data.election;
    const results = data.results;

    app.innerHTML = `
      ${renderHeader()}
      <div class="card">
        <h2>${election.title} - Official Results</h2>
        <p>Status: ${election.status}</p>
      </div>
      <div class="card">
        <h3>Vote Tally</h3>
        <table style="width:100%; text-align:left; border-collapse:collapse;">
          <tr style="border-bottom: 2px solid var(--border);">
            <th style="padding:0.5rem;">Candidate</th>
            <th style="padding:0.5rem;">Votes</th>
          </tr>
          ${results.map((r: any) => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding:0.5rem;">${r.name}</td>
              <td style="padding:0.5rem;"><strong>${r.votes}</strong></td>
            </tr>
          `).join('')}
        </table>
      </div>
      <button onclick="navigate('/')">Back Home</button>
      <button style="background:var(--text-muted); margin-left:1rem;" onclick="navigate('/audit/${electionId}')">View Audit Log</button>
    `;
  } catch (e: any) {
    app.innerHTML = `<div class="error card">${e.message}</div><button onclick="navigate('/')">Back Home</button>`;
  }
}

export async function renderAuditLog(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;
  app.innerHTML = `<div>Loading Audit Log...</div>`;

  try {
    const data = await apiFetch(`/audit/${electionId}`);
    const logs = data.logs || [];

    app.innerHTML = `
      ${renderHeader()}
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <h2>Election Audit Log</h2>
          <button onclick="navigate('/results/${electionId}')">View Results</button>
        </div>
        <p class="text-muted text-sm border-b pb-2">Cryptographically verifiable append-only log of election events.</p>
        <div style="max-height: 500px; overflow-y:auto; font-family:monospace; font-size: 0.8rem; background:#111827; color:#10b981; padding: 1rem; border-radius: 4px;">
          ${logs.map((L: any) => `
            <div style="margin-bottom: 1rem; border-bottom: 1px dashed #374151; padding-bottom: 0.5rem;">
              <span style="color:#60a5fa">${formatDateIST(L.timestamp)}</span> 
              <span style="color:#f59e0b">[${L.action}]</span>
              <br/>
              <span style="color:#f3f4f6">${L.details ? L.details : ''}</span>
            </div>
          `).join('')}
          ${logs.length === 0 ? 'No logs found' : ''}
        </div>
      </div>
      <button onclick="navigate('/')">Back Home</button>
    `;

  } catch (e: any) {
    app.innerHTML = `<div class="error card">${e.message}</div><button onclick="navigate('/')">Back Home</button>`;
  }
}

export function renderVerify() {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    ${renderHeader()}
    <div class="card" style="max-width: 600px; margin: 0 auto 4rem auto;">
      <h2>Verify Ballot</h2>
      <p>Enter your Ballot Hash to verify it was recorded in the database chain.</p>
      <input type="text" id="verify-hash" placeholder="e.g. 8f4c...a1b2" />
      <button onclick="verifyHash()">Verify</button>
      <div id="verify-result" class="mt-4"></div>
    </div>
    <div style="text-align:center;"><button onclick="navigate('/')">Back Home</button></div>
  `;

  (window as any).verifyHash = async () => {
    const hash = (document.getElementById('verify-hash') as HTMLInputElement).value.trim();
    if (!hash) return;

    const resDiv = document.getElementById('verify-result')!;
    resDiv.innerHTML = `Verifying...`;
    
    try {
      const data = await apiFetch(`/verify/${hash}`);
      const ballot = data.ballot;
      resDiv.innerHTML = `
        <div class="success" style="padding: 1rem; background: #ecfdf5; border-radius: 4px; border: 1px solid var(--success);">
          <h3>Valid Ballot Found ✓</h3>
          <p><strong>Election ID:</strong> ${ballot.election_id}</p>
          <p><strong>Cast Timestamp:</strong> ${formatDateIST(ballot.timestamp)}</p>
          <p style="word-break:break-all;"><strong>Previous Link:</strong> <br/>${ballot.previous_hash}</p>
        </div>
      `;
    } catch (e: any) {
      resDiv.innerHTML = `
        <div class="error" style="padding: 1rem; background: #fef2f2; border-radius: 4px; border: 1px solid var(--danger);">
          <h3>Verification Failed ✗</h3>
          <p>${e.message}</p>
        </div>
      `;
    }
  };
}
