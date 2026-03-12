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
        <div style="margin-top: 2rem;">
          <label for="admin-otp" style="display: block; margin-bottom: 0.75rem; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Verification Code</label>
          <input type="text" id="admin-otp" placeholder="0 0 0 0 0 0" maxlength="6" style="text-align: center; letter-spacing: 0.5em; font-family: 'Fira Code', monospace; font-size: 1.5rem; padding: 1rem; border: 2px solid var(--border); transition: border-color 0.2s;" />
        </div>
        <button style="width: 100%; margin-top: 1.5rem;" onclick="verifyAdminOTP()">Verify & Authenticate</button>
        <p class="text-center" style="margin-top: 1.5rem;">
          <a href="javascript:void(0)" onclick="location.reload()" style="font-size: 0.8rem; color: var(--text-muted); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.2s;" onmouseover="this.style.borderColor='currentColor'" onmouseout="this.style.borderColor='transparent'">Back to email input</a>
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
      <div class="animate-fade-in" style="max-width: 1000px; margin: 0 auto;">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem; letter-spacing: -0.02em;">Admin Dashboard</h1>
            <p class="text-muted">Command center for TEC Council election operations.</p>
          </div>
          <button class="secondary" onclick="logout()" style="padding: 0.6rem 1.2rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Terminate Session
          </button>
        </div>
        
        <div class="card" style="background: linear-gradient(135deg, var(--primary), #1e40af); color: white; border: none; padding: 2.5rem; margin-bottom: 3rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          <div class="flex-col gap-4">
            <h2 style="color: white; margin: 0; font-size: 1.5rem;">Initialize New Election</h2>
            <p style="color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; font-size: 0.95rem;">Enter a descriptive title to secure the cryptographic ID for a new voting record.</p>
            <div class="flex gap-2">
              <input type="text" id="new-election-title" placeholder="e.g. Executive Committee 2026" style="flex: 1; margin-bottom: 0; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 1rem 1.25rem; font-size: 1rem;" />
              <button onclick="createElection()" style="background: white; color: var(--primary); font-weight: 700; padding: 0 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">Launch</button>
            </div>
          </div>
        </div>

        <div style="margin-top: 2rem;">
          <div class="flex justify-between items-center mb-6">
            <h2 style="margin: 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-weight: 700;">Active Records</h2>
            <div style="height: 2px; flex: 1; background: var(--border); margin-left: 1.5rem; opacity: 0.5;"></div>
          </div>
          <div style="display: grid; gap: 1rem;">
            ${listHtml}
          </div>
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

        <div class="card" style="border-top: 4px solid var(--primary); padding: 2.5rem; margin-bottom: 2rem; background: linear-gradient(to bottom right, white, #f8fafc);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 2rem;">
            <div style="flex: 1; min-width: 300px;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <span class="badge badge-${election.status}" style="font-size: 0.75rem; padding: 0.25rem 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">${election.status}</span>
                <span class="text-xs font-mono text-muted" style="opacity: 0.7;">ID: ${election.id}</span>
              </div>
              <h1 style="font-size: 2.5rem; margin: 0; letter-spacing: -0.02em;">${election.title}</h1>
              <p class="text-muted mt-2" style="font-size: 0.9rem;">Created on ${formatDateIST(election.created_at)}</p>
            </div>
            
            <div style="background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); min-width: 280px;">
              <div class="flex justify-between items-center mb-2">
                <span style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">Public Voting Link</span>
                <button class="secondary" onclick="copyShareLink()" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy
                </button>
              </div>
              <input type="text" id="share-link" value="${shareLink}" readonly style="width: 100%; margin: 0; padding: 0.6rem; font-size: 0.85rem; background: #f1f5f9; border: 1px solid var(--border); border-radius: 6px; font-family: 'Fira Code', monospace;" />
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
          <div class="flex-col gap-4">
            <!-- Settings Block -->
            <div class="card" style="padding: 2rem;">
              <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Configuration
              </h3>
              <div style="margin-bottom: 1.5rem;">
                <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); opacity: 0.8;">Panel Size (Candidate count per ballot)</label>
                <input type="number" id="edit-panel" value="${election.panel_size}" ${!isDraft ? 'disabled' : ''} style="margin-top: 0.5rem;" />
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;">
                <div>
                  <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); opacity: 0.8;">Start Window</label>
                  <input type="datetime-local" id="edit-start" value="${formatLocalDatetime(election.voting_window_start)}" ${!isDraft ? 'disabled' : ''} style="margin-top: 0.5rem;" />
                </div>
                <div>
                  <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); opacity: 0.8;">End Window</label>
                  <input type="datetime-local" id="edit-end" value="${formatLocalDatetime(election.voting_window_end)}" ${!isDraft ? 'disabled' : ''} style="margin-top: 0.5rem;" />
                </div>
              </div>

              ${isDraft ? `<button class="mt-6" style="width: 100%; font-weight: 600; padding: 0.8rem;" onclick="updateSettings('${election.id}')">Update Core Settings</button>` : ''}
            </div>

            <!-- Candidates Block -->
            <div class="card" style="padding: 2rem;">
              <div class="flex justify-between items-center mb-6">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  Nominees (${candidates.length})
                </h3>
                ${isDraft ? `<button class="secondary" style="padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 600;" onclick="document.getElementById('candidate-form').style.display = 'flex'">+ Add New</button>` : ''}
              </div>

              <div id="candidate-form" style="display: none; gap: 0.5rem; margin-bottom: 1.5rem; background: var(--bg); padding: 1rem; border-radius: 8px;">
                <input type="text" id="new-candidate" placeholder="Candidate Full Name" style="margin-bottom:0; flex: 1;" />
                <button onclick="addCandidate('${election.id}')" style="white-space: nowrap;">Confirm</button>
              </div>

              <div style="display: grid; gap: 0.75rem;">
                ${candidates.map((c: any) => `
                  <div class="flex justify-between items-center" style="padding: 1rem; border: 1px solid var(--border); border-radius: 12px; background: white; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">
                    <span style="font-weight: 600; color: var(--text);">${c.name}</span>
                    ${isDraft ? `<button style="padding: 0.4rem 0.75rem; background: #feefef; color: #dc2626; border: none; font-size: 0.75rem; font-weight: 700; border-radius: 6px;" onclick="removeCandidate('${election.id}', '${c.id}')">Remove</button>` : ''}
                  </div>
                `).join('')}
                ${candidates.length === 0 ? '<div style="padding: 3rem; text-align: center; color: var(--text-muted); border: 2px dashed var(--border); border-radius: 12px;">No candidates nominated.</div>' : ''}
              </div>
            </div>
          </div>

          <div class="flex-col gap-4">
            <!-- Analytics Block -->
            <div class="card" style="padding: 2rem; background: #fdfdfd;">
              <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                Live Tally
              </h3>
              <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                ${results.map((r: any) => {
                  const maxVotes = Math.max(...results.map((cr: any) => cr.votes), 1);
                  const pct = (r.votes / maxVotes) * 100;
                  return `
                    <div>
                      <div class="flex justify-between text-sm mb-2">
                        <span style="font-weight: 700; color: var(--text);">${r.name}</span>
                        <span class="font-mono" style="color: var(--primary); font-weight: 700;">${r.votes}</span>
                      </div>
                      <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; background: linear-gradient(90deg, var(--primary), #60a5fa); width: ${pct}%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
                ${results.length === 0 ? '<div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Tally will appear once votes are cast.</div>' : ''}
              </div>
            </div>

            <!-- Participation Block -->
            <div class="card" style="padding: 2rem;">
              <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Participation
              </h3>
              <div style="font-size: 2.5rem; font-family: 'Fira Code', monospace; font-weight: 700; margin-bottom: 1.5rem; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                ${participation.length} <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">Records</span>
              </div>
              <div style="max-height: 300px; overflow-y: auto; padding-right: 0.5rem;">
                ${participation.map((p: any) => `
                  <div style="padding: 0.75rem; border-radius: 8px; background: #f8fafc; margin-bottom: 0.5rem; font-size: 0.85rem; border: 1px solid #eef2f6;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                      <span style="font-weight: 700; color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase;">${formatDateIST(p.voted_at)}</span>
                    </div>
                    <div style="font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis;">${p.email}</div>
                  </div>
                `).join('')}
                ${participation.length === 0 ? '<p class="text-center text-muted py-4">No interactions recorded.</p>' : ''}
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
