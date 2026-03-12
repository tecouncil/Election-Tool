import { apiFetch, renderHeader, formatDateIST } from '../utils/api';
import { router } from '../router';

export async function renderResults(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;
  app.innerHTML = `<div>Loading Results...</div>`;

  try {
    const data = await apiFetch(`/elections/${electionId}/results`);
    const election = data.election;
    const results = data.results || [];
    const panelSize = election.panel_size || 5;

    const topResults = results.slice(0, panelSize);
    const otherResults = results.slice(panelSize);

    app.innerHTML = `
      ${renderHeader()}
      <div class="animate-fade-in">
        <div class="card" style="border-bottom: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h1 style="margin: 0; font-size: 2rem;">Official Results</h1>
              <p class="text-muted" style="margin-top: 0.25rem;">${election.title}</p>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
              <span class="badge badge-${election.status}" style="font-size: 0.8rem; padding: 0.4rem 1rem;">${election.status}</span>
              <span class="text-sm text-muted mt-1">Verified on chain</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">Election Outcome</h2>
            <div class="text-muted text-sm font-mono">Panel Size: ${panelSize}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem;">
            ${topResults.map((r: any, idx: number) => {
              const maxVotes = Math.max(...results.map((cr: any) => cr.votes), 1);
              const pct = (r.votes / maxVotes) * 100;
              const isWinner = idx < panelSize;
              return `
                <div style="padding: 1rem; border: 1px solid ${isWinner ? 'rgba(34, 197, 94, 0.2)' : 'var(--border)'}; border-radius: 8px; background: ${isWinner ? 'rgba(34, 197, 94, 0.03)' : 'white'};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <div style="width: 24px; height: 24px; background: ${isWinner ? 'var(--success)' : 'var(--bg)'}; color: ${isWinner ? 'white' : 'var(--text-muted)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; font-family: 'Fira Code';">
                        ${idx + 1}
                      </div>
                      <span style="font-weight: 600; font-size: 1.1rem; color: var(--text);">${r.name}</span>
                      ${isWinner ? '<span style="color: var(--success); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">★ Elected</span>' : ''}
                    </div>
                    <div class="font-mono" style="font-weight: 700;">${r.votes} <span style="font-weight: 400; color: var(--text-muted); font-size: 0.8rem;">votes</span></div>
                  </div>
                  <div style="height: 4px; background: var(--bg); border-radius: 2px; overflow: hidden;">
                    <div style="height: 100%; background: ${isWinner ? 'var(--success)' : 'var(--primary)'}; width: ${pct}%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${otherResults.length > 0 ? `
          <div id="other-results-container" style="display:none; margin-top: -1rem; animation: fadeIn 0.4s ease-out;">
            <div class="card">
              <h3>Additional Contenders</h3>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${otherResults.map((r: any, idx: number) => `
                  <div class="flex justify-between items-center" style="padding: 0.75rem; border-bottom: 1px solid var(--bg);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <span class="text-muted font-mono" style="width: 24px; font-size: 0.8rem;">#${panelSize + idx + 1}</span>
                      <span>${r.name}</span>
                    </div>
                    <span class="font-mono">${r.votes}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div style="text-align:center; margin-bottom: 2rem;">
            <button class="secondary" id="btn-load-more" onclick="showOtherResults()" style="width: 100%;">
              Show All Candidates (+${otherResults.length} more)
            </button>
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div class="card">
            <h3>Participation Audit</h3>
            <div style="font-size: 2.25rem; font-family: 'Fira Code', monospace; font-weight: 700; margin-bottom: 0.5rem;">
              ${data.voterCount || 0} <span style="font-size: 0.9rem; font-weight: 400; color: var(--text-muted);">Verifiable Votes</span>
            </div>
            <p class="text-sm text-muted mb-4">Total number of unique eligible voters who cast a ballot.</p>
            
            <div style="max-height: 150px; overflow-y: auto; background: var(--bg); border-radius: 8px; padding: 1rem; font-size: 0.8rem;">
              <label style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 0.5rem;">Voter Roster (Public view)</label>
              <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                ${(data.participation || []).map((email: string) => `
                  <div style="color: var(--text);">${email}</div>
                `).join('')}
                ${(!data.participation || data.participation.length === 0) ? '<div class="text-muted">No entries found.</div>' : ''}
              </div>
            </div>
          </div>

          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h3>Security Evidence</h3>
              <p class="text-sm text-muted">This election uses a cryptographic Merkle-inspired chain for ballot integrity. You can view the full append-only audit log below.</p>
            </div>
            <div class="flex flex-col gap-2 mt-4">
              <button style="width: 100%;" onclick="navigate('/audit/${electionId}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Inspect Audit Log
              </button>
              <button class="secondary" style="width: 100%;" onclick="navigate('/')">Return Home</button>
            </div>
          </div>
        </div>
      </div>
    `;

    (window as any).showOtherResults = () => {
      document.getElementById('other-results-container')!.style.display = 'block';
      document.getElementById('btn-load-more')!.style.display = 'none';
    };
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
      <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1>Election Audit Log</h1>
            <p class="text-muted">Cryptographically verifiable technical timeline of all election events.</p>
          </div>
          <button class="secondary" onclick="navigate('/results/${electionId}')">Exit to Results</button>
        </div>
        
        <div style="background: #1e293b; border-radius: var(--radius); border: 1px solid #334155; padding: 1.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div style="display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-family: 'Fira Code', monospace; font-size: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #334155;">
            <span style="display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite;"></span>
            LIVE AUDIT CHAIN ACTIVE
          </div>
          
          <div style="max-height: 600px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-right: 0.5rem;">
            ${logs.map((L: any) => `
              <div style="padding: 1rem; background: rgba(30, 41, 59, 0.5); border: 1px solid #334155; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 0.8rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span style="color: #60a5fa; font-weight: 500;">${formatDateIST(L.timestamp)}</span>
                  <span style="color: #f59e0b; font-weight: 700;">[${L.action}]</span>
                </div>
                <div style="color: #cbd5e1; word-break: break-all; line-height: 1.4;">
                  ${L.details ? L.details : 'NO_METADATA_PROVIDED'}
                </div>
              </div>
            `).reverse().join('')}
            ${logs.length === 0 ? '<div class="text-center py-8 text-muted font-mono">NO_LOG_DATA_DETECTED</div>' : ''}
          </div>
        </div>

        <div class="text-center mt-8">
          <button class="secondary" onclick="navigate('/')">Return to Homepage</button>
        </div>
      </div>
      
      <style>
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      </style>
    `;

  } catch (e: any) {
    app.innerHTML = `<div class="error card">${e.message}</div><button onclick="navigate('/')">Back Home</button>`;
  }
}

export function renderVerify() {
  const app = document.getElementById('app')!;
    app.innerHTML = `
    ${renderHeader()}
    <div class="animate-fade-in">
      <div class="card" style="max-width: 640px; margin: 2rem auto;">
        <h1 class="text-center" style="margin-bottom: 0.5rem;">Ballot Verification</h1>
        <p class="text-muted text-center" style="margin-bottom: 2rem;">Ensure your vote was accurately recorded by querying its unique cryptographic signature.</p>
        
        <div style="background: var(--bg); padding: 1.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
          <label style="margin-bottom: 0.5rem;">Enter Ballot Hash</label>
          <div class="flex gap-2">
            <input type="text" id="verify-hash" placeholder="e.g. 8f4c3a2b1..." style="margin-bottom: 0; font-family: 'Fira Code', monospace; flex: 1;" />
            <button onclick="verifyHash()" style="min-width: 120px;">Verify Now</button>
          </div>
        </div>

        <div id="verify-result" class="mt-6"></div>
      </div>
      <div class="text-center">
        <button class="secondary" onclick="navigate('/')">Return to Platform Hub</button>
      </div>
    </div>
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
        <div class="card animate-fade-in" style="background: #f0fdf4; border: 1px solid #bcf0da; padding: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; color: #166534; margin-bottom: 1rem;">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
             <h3 style="margin: 0; color: #166534;">Verified Integrity ✓</h3>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
            <div>
              <label style="color: #65a30d; font-size: 0.6rem;">Election Record</label>
              <div style="font-weight: 600;">E-ID: ${ballot.election_id}</div>
            </div>
            <div>
              <label style="color: #65a30d; font-size: 0.6rem;">Cast On</label>
              <div style="font-weight: 600;">${formatDateIST(ballot.timestamp)}</div>
            </div>
            <div style="grid-column: span 2;">
              <label style="color: #65a30d; font-size: 0.6rem;">Chain Connectivity (Previous Hash)</label>
              <div class="font-mono" style="word-break: break-all; font-size: 0.75rem; color: #3f6212; padding: 0.5rem; background: rgba(255,255,255,0.5); border-radius: 4px;">
                ${ballot.previous_hash || 'ROOT_GENESIS_BLOCK'}
              </div>
            </div>
          </div>
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
