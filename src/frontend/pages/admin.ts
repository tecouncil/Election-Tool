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
        <input type="email" id="admin-email" placeholder="admin@example.com" />
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
    const [electionData, candidatesData, votersData] = await Promise.all([
      apiFetch(`/elections/${electionId}`),
      apiFetch(`/elections/${electionId}/candidates`),
      apiFetch(`/elections/${electionId}/voters`)
    ]);

    const election = electionData.election;
    const candidates = candidatesData.candidates;
    const roll = votersData.roll;

    const isDraft = election.status === 'draft';

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
        <h3>Settings</h3>
        <label>Panel Size (Number of candidate choices required)</label>
        <input type="number" id="edit-panel" value="${election.panel_size}" ${!isDraft ? 'disabled' : ''} />
        ${isDraft ? `<button onclick="updateSettings('${election.id}')">Save Settings</button>` : ''}
      </div>

      <div class="flex gap-4" style="display:flex; gap: 1rem;">
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
          <h3>Voter Roll (${roll.length})</h3>
          ${isDraft ? `
            <div class="flex gap-2">
              <input type="email" id="new-voter" placeholder="voter@example.com" />
              <button onclick="addVoter('${election.id}')">Add</button>
            </div>
            <p class="text-muted mt-2">Bulk Import (Emails on new lines)</p>
            <textarea id="bulk-voter" rows="4"></textarea>
            <button onclick="importVoters('${election.id}')">Import</button>
          ` : ''}
          <ul style="padding-left:0;list-style:none;max-height:300px;overflow-y:auto;" class="mt-4">
            ${roll.map((v: any) => `
              <li class="flex justify-between mt-2">
                <span>${v.email}</span>
                ${isDraft ? `<button style="background:var(--danger);padding:0.2rem 0.5rem;" onclick="removeVoter('${election.id}', '${encodeURIComponent(v.email)}')">X</button>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

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
      (window as any).addVoter = async (id: string) => {
        const email = (document.getElementById('new-voter') as HTMLInputElement).value;
        if (!email) return;
        await apiFetch(`/elections/${id}/voters`, { method: 'POST', body: JSON.stringify({ email }) }).catch(e => alert(e.message));
        renderAdminElectionEdit([id]);
      };
      (window as any).importVoters = async (id: string) => {
        const text = (document.getElementById('bulk-voter') as HTMLTextAreaElement).value;
        if (!text) return;
        await apiFetch(`/elections/${id}/voters/import`, { method: 'POST', body: text }).catch(e => alert(e.message));
        renderAdminElectionEdit([id]);
      };
      (window as any).removeVoter = async (id: string, email: string) => {
        await apiFetch(`/elections/${id}/voters/${email}`, { method: 'DELETE' });
        renderAdminElectionEdit([id]);
      };
      (window as any).openElection = async (id: string) => {
        if(confirm('Are you sure you want to open this election? No more changes to candidates or voters can be made.')) {
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
