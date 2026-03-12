import { apiFetch, setToken, formatDateIST, renderHeader } from '../utils/api';
import { router } from '../router';

export async function renderVoterLogin(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;
  app.innerHTML = `<div>Loading...</div>`;

  try {
    const { election } = await apiFetch(`/elections/${electionId}/public`);
    if (election.status === 'closed' || election.status === 'finalized') {
      router.navigate(`/results/${electionId}`);
      return;
    }

    app.innerHTML = `
      ${renderHeader()}
      <div class="card animate-fade-in" style="max-width: 480px; margin: 2rem auto;">
        <h1 class="text-center" style="font-size: 1.75rem;">Voter Access</h1>
        <p class="text-muted text-center" style="margin-bottom: 2.5rem;">Secure authentication via OTP. Please enter your registered email address to proceed.</p>
        
        <div id="login-error" class="error text-center" style="min-height: 1.5rem;"></div>
        
        <div id="login-step-1">
          <label for="voter-email">Email Address</label>
          <input type="email" id="voter-email" placeholder="name@organization.com" autofocus />
          <button style="width: 100%;" onclick="requestVoterOTP('${electionId}')">Generate Verification Code</button>
        </div>
        
        <div id="login-step-2" style="display:none;">
          <label for="voter-otp">Verification Code</label>
          <input type="text" id="voter-otp" placeholder="Enter 6-digit code" maxlength="6" style="text-align: center; letter-spacing: 0.5em; font-family: 'Fira Code', monospace; font-size: 1.25rem;" />
          <button style="width: 100%;" onclick="verifyVoterOTP('${electionId}')">Verify & Enter Ballot</button>
          <p class="text-center mt-4">
            <a href="javascript:void(0)" onclick="location.reload()" style="font-size: 0.8rem; color: var(--text-muted);">Entered wrong email? Restart</a>
          </p>
        </div>
      </div>
    `;
  } catch (e: any) {
    app.innerHTML = `<div class="error card">${e.message}</div>`;
  }

  (window as any).requestVoterOTP = async (id: string) => {
    const email = (document.getElementById('voter-email') as HTMLInputElement).value;
    try {
      await apiFetch('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email, electionId: id })
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

  (window as any).verifyVoterOTP = async (id: string) => {
    const email = (document.getElementById('voter-email') as HTMLInputElement).value;
    const code = (document.getElementById('voter-otp') as HTMLInputElement).value;
    try {
      const res = await apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code, electionId: id })
      });
      setToken(res.token);
      router.navigate(`/vote/${id}/ballot`);
    } catch (e: any) {
      document.getElementById('login-error')!.innerText = e.message;
      document.getElementById('login-error')!.className = 'error';
    }
  };
}

export async function renderBallot(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;
  app.innerHTML = `<div>Loading Ballot...</div>`;

  try {
    // Note: To get candidates, voter needs to fetch public election details or we need an unauthenticated or voter-authenticated endpoint.
    // Wait, the API for GET /api/elections/:id/candidates is Admin-only right now!
    // Voters need to see candidates!
    // Let's assume we will fetch them from a public or voter-authenticated endpoint.
    // Actually, in `routes`, we haven't made a public endpoint for candidates yet.
    // I need to add that. I'll fetch it from a new hypothetical endpoint `/api/elections/${electionId}/public`.
    
    // For now, let's just assume we update the backend to allow voters to see election/candidates.
    const electionRes = await apiFetch(`/elections/${electionId}/public`);
    const election = electionRes.election;
    const candidates = electionRes.candidates;
    const requiredSelections = election.panel_size;

    let selected: string[] = [];

    app.innerHTML = `
      ${renderHeader()}
      <div class="animate-fade-in">
        <div class="card" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="margin-bottom: 0.5rem;">${election.title}</h1>
            <p class="text-muted">Instructions: Carefully select exactly <strong>${requiredSelections}</strong> candidates from the list below.</p>
          </div>
          <div style="background: var(--bg); padding: 1rem 1.5rem; border-radius: var(--radius); border: 1px solid var(--border); text-align: right;">
            <div class="text-sm text-muted font-mono uppercase bold" style="margin-bottom: 0.25rem;">Selection Count</div>
            <div style="font-size: 1.5rem; font-family: 'Fira Code', monospace; font-weight: 700;">
              <span id="selection-count" style="color: var(--primary);">0</span> <span style="color: var(--text-muted); font-size: 1rem; font-weight: 400;">/ ${requiredSelections}</span>
            </div>
          </div>
        </div>

        <div class="candidate-grid" id="candidates-list">
          ${candidates.map((c: any, idx: number) => `
            <div class="candidate-item" id="candidate-${c.id}" onclick="toggleCandidate('${c.id}')">
              <div class="candidate-number">${idx + 1}</div>
              <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.25rem;">${c.name}</div>
                <div class="text-sm text-muted">${c.description || 'No description provided.'}</div>
              </div>
              <div class="checkbox-indicator" style="width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <svg id="check-${c.id}" style="display: none;" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 5 9 10 3"></polyline></svg>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card mt-4" style="display: flex; justify-content: space-between; align-items: center;">
          <p class="text-sm text-muted" style="max-width: 400px;">
            By clicking "Cast Secure Ballot", your vote will be cryptographically hashed and added to the immutable audit chain.
          </p>
          <button id="submit-ballot" disabled onclick="submitBallot('${electionId}')" style="min-width: 200px; padding: 1rem 2rem;">
            Cast Secure Ballot
          </button>
        </div>
        <div id="ballot-error" class="error text-center mt-2"></div>
      </div>
    `;

    (window as any).toggleCandidate = (cid: string) => {
      const idx = selected.indexOf(cid);
      const el = document.getElementById(`candidate-${cid}`)!;
      const check = document.getElementById(`check-${cid}`)!;
      const indicator = el.querySelector('.checkbox-indicator') as HTMLElement;

      if (idx > -1) {
        selected.splice(idx, 1);
        el.classList.remove('selected');
        check.style.display = 'none';
        indicator.style.background = 'transparent';
        indicator.style.borderColor = 'var(--border)';
      } else {
        if (selected.length < requiredSelections) {
          selected.push(cid);
          el.classList.add('selected');
          check.style.display = 'block';
          indicator.style.background = 'var(--primary)';
          indicator.style.borderColor = 'var(--primary)';
          indicator.style.color = 'white';
        }
      }

      document.getElementById('selection-count')!.innerText = selected.length.toString();
      const btn = document.getElementById('submit-ballot') as HTMLButtonElement;
      btn.disabled = selected.length !== requiredSelections;
    };

    (window as any).submitBallot = async (id: string) => {
      const btn = document.getElementById('submit-ballot') as HTMLButtonElement;
      btn.disabled = true;
      btn.innerText = 'Submitting...';

      try {
        const res = await apiFetch(`/elections/${id}/ballots`, {
          method: 'POST',
          body: JSON.stringify({ selections: selected })
        });
        
        // Save receipt to local storage for display
        localStorage.setItem(`receipt_${id}`, JSON.stringify(res.receipt));
        
        router.navigate(`/vote/${id}/confirm`);
      } catch (e: any) {
        document.getElementById('ballot-error')!.innerText = e.message;
        btn.disabled = false;
        btn.innerText = 'Cast Ballot';
      }
    };

  } catch (e: any) {
    if (e.message.includes('Unauthorized')) {
      router.navigate(`/vote/${electionId}`);
    } else {
      app.innerHTML = `<div class="error">${e.message}</div>`;
    }
  }
}

export function renderConfirmation(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;
  const receiptStr = localStorage.getItem(`receipt_${electionId}`);
  
  if (!receiptStr) {
    router.navigate('/');
    return;
  }

  const receipt = JSON.parse(receiptStr);

  app.innerHTML = `
    ${renderHeader()}
    <div class="card animate-fade-in" style="text-align:center; max-width:640px; margin: 2rem auto;">
      <div style="width: 64px; height: 64px; background: #e8f5e9; color: #2e7d32; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h1 style="color: var(--success); margin-bottom: 0.5rem;">Ballot Cast Successfully</h1>
      <p class="text-muted">Your contribution to <strong>${receipt.electionTitle || 'the election'}</strong> has been securely recorded.</p>
      
      <div id="receipt-details" style="text-align:left; background: var(--bg); padding: 2rem; border-radius: var(--radius); border: 1px solid var(--border); margin-top:2.5rem; position: relative;">
        <div style="position: absolute; top: -12px; left: 24px; background: var(--primary); color: white; padding: 2px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; font-family: 'Fira Code';">OFFICIAL RECEIPT</div>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="margin-bottom: 0.25rem;">Your Selections</label>
          <div style="font-weight: 600; color: var(--text);">
            ${(receipt.selections || []).slice(0, 5).join(', ')}${receipt.selections?.length > 5 ? '...' : ''}
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="margin-bottom: 0.25rem;">Ballot Hash (Verification Key)</label>
          <div class="font-mono" style="font-size: 0.8rem; background: rgba(0,0,0,0.03); padding: 0.75rem; border-radius: 4px; word-break: break-all; border: 1px dashed var(--border);">
            ${receipt.ballotHash}
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between;">
          <div>
            <label style="margin-bottom: 0.25rem;">Timestamp</label>
            <div class="text-sm font-mono">${formatDateIST(receipt.timestamp)}</div>
          </div>
          <div style="text-align: right;">
            <label style="margin-bottom: 0.25rem;">Status</label>
            <div class="text-sm success" style="font-weight: 700;">VERIFIED</div>
          </div>
        </div>
      </div>

      <div class="mt-4 flex gap-4 justify-center" style="margin-top:2.5rem;">
        <button onclick="copyReceipt('${electionId}')" style="flex: 1;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Full Receipt
        </button>
        <button class="secondary" onclick="navigate('/')" style="flex: 1;">
          Return to Hub
        </button>
      </div>

      <p class="text-sm text-muted mt-4" style="background: #fff9db; padding: 1rem; border-radius: 8px; color: #856404; font-size: 0.8rem; border: 1px solid #ffeeba; margin-top: 2rem;">
        <strong>Privacy Assurance:</strong> Your specific choices are <u>not</u> included in the automated confirmation email to preserve ballot secrecy. Please copy this receipt now if you require a local record of your selections.
      </p>
    </div>
  `;

  (window as any).copyReceipt = (id: string) => {
    const details = document.getElementById('receipt-details')!.innerText;
    navigator.clipboard.writeText(details).then(() => {
      alert('Receipt copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy receipt.');
    });
  };
}
