import { apiFetch, setToken, formatDateIST, formatLocalDatetime, renderHeader } from '../utils/api';
import { router } from '../router';

export function renderAdminLogin() {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    ${renderHeader()}
    <div class="card animate-fade-in" style="max-width: 440px; margin: 2rem auto;">
      <h1 class="text-center" style="font-size: 1.75rem;">Admin Access</h1>
      <p class="text-muted text-center" style="margin-bottom: 2.5rem;">Secure administrative portal for election management.</p>
      
      <div id="login-error" class="error text-center" style="min-height: 1.5rem;"></div>
      
      <div id="login-step-1">
        <label for="admin-email">Administrator Email</label>
        <input type="email" id="admin-email" placeholder="admin@organization.com" value="tecouncil.org@gmail.com" autofocus />
        <button style="width: 100%;" onclick="requestAdminOTP()">Request Authorization Code</button>
      </div>

      <div id="login-step-2" style="display:none;">
        <label for="admin-otp">Verification Code</label>
        <input type="text" id="admin-otp" placeholder="Enter 6-digit code" maxlength="6" style="text-align: center; letter-spacing: 0.5em; font-family: 'Fira Code', monospace; font-size: 1.25rem;" />
        <button style="width: 100%;" onclick="verifyAdminOTP()">Verify & Authenticate</button>
        <p class="text-center mt-4">
          <a href="javascript:void(0)" onclick="location.reload()" style="font-size: 0.8rem; color: var(--text-muted);">Back to email input</a>
        </p>
      </div>
    </div>
  `;

  (window as any).requestAdminOTP = async () => {
    const email = (document.getElementById('admin-email') as HTMLInputElement).value;
    try {
      await apiFetch('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email, isAdminLogin: true })
      });
      document.getElementById('login-step-1')!.style.display = 'none';
      document.getElementById('login-step-2')!.style.display = 'block';
      document.getElementById('login-error')!.innerText = 'OTP sent to email. Please check your inbox.';
      document.getElementById('login-error')!.className = 'success';
    } catch (e: any) {
      document.getElementById('login-error')!.innerText = e.message;
      document.getElementById('login-error')!.className = 'error';
    }
  };

  (window as any).verifyAdminOTP = async () => {
    const email = (document.getElementById('admin-email') as HTMLInputElement).value;
    const code = (document.getElementById('admin-otp') as HTMLInputElement).value;
    try {
      const res = await apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code, isAdminLogin: true })
      });
      setToken(res.token);
      router.navigate('/admin');
    } catch (e: any) {
      document.getElementById('login-error')!.innerText = e.message;
      document.getElementById('login-error')!.className = 'error';
    }
  };
}

export async function renderAdminDashboard() {
  const app = document.getElementById('app')!;
  app.innerHTML = `<div>Loading...</div>`;

  try {
    const data = await apiFetch('/elections');
    const elections = data.elections || [];

    let listHtml = elections.map((e: any) => `
      <div class="card flex justify-between items-center animate-fade-in">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
            <h3 style="margin:0;">${e.title}</h3>
            <span class="badge badge-${e.status}">${e.status}</span>
          </div>
          <p class="text-muted text-sm">Created: ${formatDateIST(e.created_at)}</p>
        </div>
        <button class="secondary" onclick="navigate('/admin/elections/${e.id}')">
          Manage
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    `).join('');

    if (elections.length === 0) {
      listHtml = `
        <div class="card text-center text-muted" style="padding: 4rem 2rem;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>No elections have been created yet.</p>
        </div>
      `;
    }

    app.innerHTML = `
      ${renderHeader()}
      <div class="animate-fade-in">
        <div class="flex justify-between items-end mb-4">
          <div>
            <h1>Admin Dashboard</h1>
            <p class="text-muted">Overview of all active and pending elections.</p>
          </div>
          <button class="danger" onclick="logout()" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Terminate Session</button>
        </div>
        
        <div class="card" style="background: var(--primary); color: white; border: none;">
          <h3 style="color: white; margin-bottom: 1rem;">Launch New Election</h3>
          <div class="flex gap-2">
            <input type="text" id="new-election-title" placeholder="Enter Descriptive Title (e.g. Student Council 2026)" style="margin-bottom: 0; background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); color: white;" />
            <button onclick="createElection()" style="background: white; color: var(--primary); min-width: 120px;">Initialize</button>
          </div>
        </div>

        <div style="margin-top: 2rem;">
          <h2 style="margin-bottom: 1.5rem; font-size: 1.25rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">Active Records</h2>
          ${listHtml}
        </div>
      </div>
    `;

    (window as any).createElection = async () => {
      const title = (document.getElementById('new-election-title') as HTMLInputElement).value;
      if (!title) return;
      const res = await apiFetch('/elections', {
        method: 'POST',
        body: JSON.stringify({ title })
      });
      if (res.election && res.election.id) {
        router.navigate(`/admin/elections/${res.election.id}`);
      } else {
        renderAdminDashboard();
      }
    };

  } catch (e: any) {
    if (e.message.includes('Unauthorized') || e.message.includes('Forbidden')) {
      router.navigate('/admin/login');
    } else {
      app.innerHTML = `<div class="error">${e.message}</div>`;
    }
  }
}

export async function renderAdminElectionEdit(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;
  app.innerHTML = `<div>Loading...</div>`;

  try {
    const [electionData, candidatesData, participationData, resultsData] = await Promise.all([
      apiFetch(`/elections/${electionId}`),
      apiFetch(`/elections/${electionId}/candidates`),
      apiFetch(`/elections/${electionId}/participation`),
      apiFetch(`/elections/${electionId}/internal-results`)
    ]);

    const election = electionData.election;
    const candidates = candidatesData.candidates;
    const participation = participationData.participation;
    const results = resultsData.results;

    const isDraft = election.status === 'draft';
    const shareLink = window.location.origin + '/vote/' + election.id;

    app.innerHTML = `
      ${renderHeader()}
      <div class="animate-fade-in">
        <div class="flex justify-between items-center mb-4">
          <button class="secondary" onclick="navigate('/admin')" style="padding: 0.5rem 1rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Dashboard
          </button>
          <div style="display: flex; gap: 0.5rem;">
            ${isDraft ? `
              <button onclick="openElection('${election.id}')">Activate Election</button>
            ` : ''}
            ${election.status === 'open' ? `
              <button class="danger" onclick="closeElection('${election.id}')">Deactivate (Close)</button>
            ` : ''}
            ${election.status === 'closed' ? `
              <button style="background:var(--success)" onclick="finalizeElection('${election.id}')">Publish Results</button>
            ` : ''}
          </div>
        </div>

        <div class="card" style="border-left: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0;">${election.title}</h1>
              <div style="margin-top: 0.5rem; display: flex; gap: 1rem; align-items: center;">
                <span class="badge badge-${election.status}">${election.status}</span>
                <span class="text-sm text-muted">ID: ${election.id}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <small class="text-muted uppercase bold" style="font-size: 0.7rem;">Share Link</small>
              <div class="flex gap-2 mt-1">
                <input type="text" id="share-link" value="${shareLink}" readonly style="margin:0; padding: 0.4rem 0.75rem; font-size: 0.8rem; background: var(--bg);" />
                <button class="secondary" onclick="copyShareLink()" style="padding: 0.4rem 0.75rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
              </div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
          <div class="flex-col gap-4">
            <!-- Settings Block -->
            <div class="card">
              <h3>Configuration</h3>
              <div style="margin-bottom: 1.5rem;">
                <label>Panel Size (Candidate count per ballot)</label>
                <input type="number" id="edit-panel" value="${election.panel_size}" ${!isDraft ? 'disabled' : ''} />
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label>Start Window</label>
                  <input type="datetime-local" id="edit-start" value="${formatLocalDatetime(election.voting_window_start)}" ${!isDraft ? 'disabled' : ''} />
                </div>
                <div>
                  <label>End Window</label>
                  <input type="datetime-local" id="edit-end" value="${formatLocalDatetime(election.voting_window_end)}" ${!isDraft ? 'disabled' : ''} />
                </div>
              </div>

              ${isDraft ? `<button class="mt-4" style="width: 100%;" onclick="updateSettings('${election.id}')">Update Core Settings</button>` : ''}
            </div>

            <!-- Candidates Block -->
            <div class="card">
              <div class="flex justify-between items-center mb-4">
                <h3 style="margin:0;">Nominees (${candidates.length})</h3>
                ${isDraft ? `<button class="secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="document.getElementById('candidate-form').style.display = 'flex'">+ Add New</button>` : ''}
              </div>

              <div id="candidate-form" style="display: none; gap: 0.5rem; margin-bottom: 1rem;">
                <input type="text" id="new-candidate" placeholder="Candidate Full Name" style="margin-bottom:0;" />
                <button onclick="addCandidate('${election.id}')">Confirm</button>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${candidates.map((c: any) => `
                  <div class="flex justify-between items-center" style="padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: white;">
                    <span style="font-weight: 500;">${c.name}</span>
                    ${isDraft ? `<button style="padding: 0.25rem 0.5rem; background: #fee2e2; color: #dc2626;" onclick="removeCandidate('${election.id}', '${c.id}')">Remove</button>` : ''}
                  </div>
                `).join('')}
                ${candidates.length === 0 ? '<p class="text-center text-muted py-4">No candidates nominated.</p>' : ''}
              </div>
            </div>
          </div>

          <div class="flex-col gap-4">
            <!-- Analytics Block -->
            <div class="card">
              <h3>Live Tally</h3>
              <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                ${results.map((r: any) => {
                  const maxVotes = Math.max(...results.map((cr: any) => cr.votes), 1);
                  const pct = (r.votes / maxVotes) * 100;
                  return `
                    <div>
                      <div class="flex justify-between text-sm mb-1">
                        <span style="font-weight: 600;">${r.name}</span>
                        <span class="font-mono">${r.votes}</span>
                      </div>
                      <div style="height: 6px; background: var(--bg); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; background: var(--primary); width: ${pct}%; transition: width 0.5s ease-out;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
                ${results.length === 0 ? '<p class="text-center text-muted">Tally will appear once votes are cast.</p>' : ''}
              </div>
            </div>

            <!-- Participation Block -->
            <div class="card">
              <h3>Participation</h3>
              <div style="font-size: 2rem; font-family: 'Fira Code', monospace; font-weight: 700; margin: 0.5rem 0;">
                ${participation.length} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">Voters</span>
              </div>
              <div style="max-height: 250px; overflow-y: auto; font-size: 0.8rem;">
                ${participation.map((p: any) => `
                  <div style="padding: 0.4rem 0; border-bottom: 1px solid var(--bg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span class="text-muted" style="font-size: 0.7rem;">${formatDateIST(p.voted_at)}</span><br/>
                    ${p.email}
                  </div>
                `).join('')}
                ${participation.length === 0 ? '<p class="text-muted">No interactions recorded.</p>' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    (window as any).copyShareLink = () => {
      const input = document.getElementById('share-link') as HTMLInputElement;
      input.select();
      input.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(input.value).then(() => {
        alert('Copied to clipboard');
      }).catch(() => {
        alert('Failed to copy');
      });
    };

    // Bind UI actions
    if (isDraft) {
      (window as any).updateSettings = async (id: string) => {
        const pSize = parseInt((document.getElementById('edit-panel') as HTMLInputElement).value, 10);
        const startLocal = (document.getElementById('edit-start') as HTMLInputElement).value;
        const endLocal = (document.getElementById('edit-end') as HTMLInputElement).value;
        
        // Assume the input is IST (+05:30) and convert to UTC ISO string for backend
        const start = startLocal ? new Date(startLocal + ':00+05:30').toISOString() : null;
        const end = endLocal ? new Date(endLocal + ':00+05:30').toISOString() : null;
        
        await apiFetch(`/elections/${id}`, { 
          method: 'PATCH', 
          body: JSON.stringify({ 
            panel_size: pSize,
            voting_window_start: start,
            voting_window_end: end
          }) 
        });
        renderAdminElectionEdit([id]);
      };
      (window as any).addCandidate = async (id: string) => {
        const name = (document.getElementById('new-candidate') as HTMLInputElement).value;
        if (!name) return;
        await apiFetch(`/elections/${id}/candidates`, { method: 'POST', body: JSON.stringify({ name }) });
        renderAdminElectionEdit([id]);
      };
      (window as any).removeCandidate = async (id: string, cid: string) => {
        await apiFetch(`/elections/${id}/candidates/${cid}`, { method: 'DELETE' });
        renderAdminElectionEdit([id]);
      };
      (window as any).openElection = async (id: string) => {
        if(confirm('Are you sure you want to open this election? No more changes to candidates can be made.')) {
          await apiFetch(`/elections/${id}/open`, { method: 'POST' }).catch(e => alert(e.message));
          renderAdminElectionEdit([id]);
        }
      };
    }

    (window as any).closeElection = async (id: string) => {
      if(confirm('Close election? Voters will no longer be able to vote.')) {
        await apiFetch(`/elections/${id}/close`, { method: 'POST' }).catch(e => alert(e.message));
        renderAdminElectionEdit([id]);
      }
    };

    (window as any).finalizeElection = async (id: string) => {
      if(confirm('Finalize election? Results will be made public.')) {
        await apiFetch(`/elections/${id}/finalize`, { method: 'POST' }).catch(e => alert(e.message));
        renderAdminElectionEdit([id]);
      }
    };

  } catch (e: any) {
    if (e.message.includes('Unauthorized') || e.message.includes('Forbidden')) {
      router.navigate('/admin/login');
    } else {
      app.innerHTML = `<div class="error">${e.message}</div>`;
    }
  }
}
