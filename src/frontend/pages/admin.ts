import { apiFetch, setToken } from '../utils/api';
import { router } from '../router';

export function renderAdminLogin() {
  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div class="card" style="max-width: 400px; margin: 4rem auto;">
      <h2>Admin Login</h2>
      <div id="login-error" class="error"></div>
      <div id="login-step-1">
        <label>Email Address</label>
        <input type="email" id="admin-email" placeholder="admin@example.com" value="tecouncil.org@gmail.com" />
        <button onclick="requestAdminOTP()">Send OTP</button>
      </div>
      <div id="login-step-2" style="display:none;">
        <label>Verification Code</label>
        <input type="text" id="admin-otp" placeholder="123456" />
        <button onclick="verifyAdminOTP()">Verify & Login</button>
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
      <div class="card flex justify-between items-center">
        <div>
          <h3>${e.title}</h3>
          <p class="text-muted">Status: <strong>${e.status}</strong></p>
        </div>
        <button onclick="navigate('/admin/elections/${e.id}')">Manage</button>
      </div>
    `).join('');

    if (elections.length === 0) {
      listHtml = `<p>No elections found.</p>`;
    }

    app.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h2>Admin Dashboard</h2>
        <button onclick="logout()">Logout</button>
      </div>
      <div class="card">
        <h3>Create Election</h3>
        <input type="text" id="new-election-title" placeholder="Election Title" />
        <button onclick="createElection()">Create</button>
      </div>
      <div>
        ${listHtml}
      </div>
    `;

    (window as any).createElection = async () => {
      const title = (document.getElementById('new-election-title') as HTMLInputElement).value;
      if (!title) return;
      await apiFetch('/elections', {
        method: 'POST',
        body: JSON.stringify({ title })
      });
      renderAdminDashboard();
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
      apiFetch(`/elections/${electionId}/results`)
    ]);

    const election = electionData.election;
    const candidates = candidatesData.candidates;
    const participation = participationData.participation;
    const results = resultsData.results;

    const isDraft = election.status === 'draft';
    const shareLink = window.location.origin + '/vote/' + election.id;

    app.innerHTML = `
      <button onclick="navigate('/admin')" style="background:var(--text-muted);margin-bottom:1rem;">&larr; Back to Dashboard</button>
      <div class="card">
        <h2>${election.title} </h2>
        <p>Status: <strong>${election.status}</strong></p>
        ${isDraft ? `
          <button class="mt-2" onclick="openElection('${election.id}')">Open Election</button>
        ` : ''}
        ${election.status === 'open' ? `
          <button class="mt-2" onclick="closeElection('${election.id}')" style="background:var(--danger)">Close Election</button>
        ` : ''}
        ${election.status === 'closed' ? `
          <button class="mt-2" onclick="finalizeElection('${election.id}')" style="background:var(--success)">Finalize Results</button>
        ` : ''}
      </div>

      <div class="card">
        <h3>Share Election</h3>
        <p class="text-sm text-muted mb-2">Share this link with voters to allow them to participate.</p>
        <div class="flex gap-2" style="display:flex; gap:0.5rem; align-items:center;">
          <input type="text" id="share-link" value="${shareLink}" readonly style="flex:1; background:#f3f4f6; color:#555;" />
          <button onclick="copyShareLink()">Copy</button>
        </div>
      </div>

      <div class="card">
        <h3>Settings</h3>
        <label>Panel Size (Number of candidate choices required)</label>
        <input type="number" id="edit-panel" value="${election.panel_size}" ${!isDraft ? 'disabled' : ''} />
        ${isDraft ? `<button onclick="updateSettings('${election.id}')">Save Settings</button>` : ''}
      </div>

      <div class="flex gap-4" style="display:flex; gap: 1rem; align-items: flex-start;">
        <div class="card" style="flex:1;">
          <h3>Candidates (${candidates.length})</h3>
          ${isDraft ? `
            <div class="flex gap-2">
              <input type="text" id="new-candidate" placeholder="Candidate Name" />
              <button onclick="addCandidate('${election.id}')">Add</button>
            </div>
          ` : ''}
          <ul style="padding-left:0;list-style:none;">
            ${candidates.map((c: any) => `
              <li class="candidate-item justify-between">
                <span>${c.name}</span>
                ${isDraft ? `<button style="background:var(--danger)" onclick="removeCandidate('${election.id}', '${c.id}')">X</button>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="card" style="flex:1;">
          <h3>Live Results</h3>
          <ul style="padding-left:0;list-style:none;">
            ${results.map((r: any) => `
              <li class="candidate-item justify-between">
                <span>${r.name}</span>
                <span class="badge">${r.votes} votes</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <div class="card">
        <h3>Voter Participation (${participation.length} total)</h3>
        <p class="text-muted text-sm" style="margin-bottom: 1rem;">The following users have successfully cast their ballots.</p>
        <div style="max-height: 200px; overflow-y: auto; background: #fafafa; border-radius: 4px; padding: 0.5rem;">
          <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #eee;">
                <th style="padding: 0.5rem;">Voter Email</th>
                <th style="padding: 0.5rem;">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${participation.map((p: any) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 0.5rem;">${p.email}</td>
                  <td style="padding: 0.5rem; font-size: 0.8rem; color: #666;">${new Date(p.voted_at).toLocaleString()}</td>
                </tr>
              `).join('')}
              ${participation.length === 0 ? '<tr><td colspan="2" style="padding: 1rem; text-align: center; color: #999;">No votes cast yet</td></tr>' : ''}
            </tbody>
          </table>
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
        await apiFetch(`/elections/${id}`, { method: 'PATCH', body: JSON.stringify({ panel_size: pSize }) });
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
