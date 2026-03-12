import { apiFetch, setToken, formatDateIST, renderHeader } from '../utils/api';
import { router } from '../router';

export async function renderVoterLogin(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;
  app.innerHTML = `<div>Loading...</div>`;

  try {
    const { election } = await apiFetch(`/elections/${electionId}/public`);
    
    if (election.status === 'closed' || election.status === 'finalized') {
      // Show a proper "Election Ended" status page BEFORE login
      app.innerHTML = `
        ${renderHeader()}
        <div class="animate-fade-in card" style="max-width: 540px; margin: 3rem auto; text-align: center; padding: 3rem 2rem;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem auto;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h1 style="font-size: 2rem; margin-bottom: 0.75rem; letter-spacing: -0.02em;">Voting has Ended</h1>
          <p class="text-muted" style="font-size: 1rem; line-height: 1.6; max-width: 380px; margin: 0 auto 2.5rem auto;">The voting window for <strong>${election.title}</strong> has now closed. Thank you to all who participated.</p>
          ${election.status === 'finalized' ? `
            <button style="width: 100%; max-width: 280px; font-weight: 700; padding: 1rem;" onclick="navigate('/results/${electionId}')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 0.5rem;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              View Official Results
            </button>
            <p style="margin-top: 1.5rem; font-size: 0.8rem; color: var(--text-muted);">Results have been published and are publicly available.</p>
          ` : `
            <div style="background: var(--bg); padding: 1rem 1.5rem; border-radius: 12px; font-size: 0.85rem; color: var(--text-muted); border: 1px solid var(--border); margin: 0 auto; max-width: 360px;">
              Results are being tabulated and will be published shortly.
            </div>
          `}
          <button class="secondary" style="margin-top: 1.5rem;" onclick="navigate('/')">
            Return to Homepage
          </button>
        </div>
      `;
      return;
    }

    if (election.status === 'draft') {
      app.innerHTML = `
        ${renderHeader()}
        <div class="animate-fade-in card" style="max-width: 540px; margin: 3rem auto; text-align: center; padding: 3rem 2rem;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem auto;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h1 style="font-size: 2rem; margin-bottom: 0.75rem;">Voting Not Yet Open</h1>
          <p class="text-muted" style="font-size: 1rem; margin: 0 auto 2rem auto; max-width: 380px;">This election has not started yet. Please check back later.</p>
          <button class="secondary" onclick="navigate('/')">Return to Homepage</button>
        </div>
      `;
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
          <div style="margin-top: 2rem;">
            <label for="voter-otp" style="display: block; margin-bottom: 0.75rem; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Verification Code</label>
            <input type="text" id="voter-otp" placeholder="0 0 0 0 0 0" maxlength="6" style="text-align: center; letter-spacing: 0.5em; font-family: 'Fira Code', monospace; font-size: 1.5rem; padding: 1rem; border: 2px solid var(--border); transition: border-color 0.2s;" />
          </div>
          <button style="width: 100%; margin-top: 1.5rem;" onclick="verifyVoterOTP('${electionId}')">Verify & Enter Ballot</button>
          <p class="text-center" style="margin-top: 1.5rem;">
            <a href="javascript:void(0)" onclick="location.reload()" style="font-size: 0.8rem; color: var(--text-muted); text-decoration: none;">Entered wrong email? Restart</a>
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
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto;">
        <!-- Ballot Header -->
        <div class="card" style="margin-bottom: 1.5rem; border-top: 4px solid var(--primary); padding: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem;">
            <div style="flex: 1; min-width: 200px;">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <span class="badge badge-open" style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">LIVE</span>
              </div>
              <h1 style="font-size: 2rem; margin: 0 0 0.5rem 0; letter-spacing: -0.02em;">${election.title}</h1>
              <p class="text-muted" style="margin: 0; font-size: 0.9rem;">Instructions: Select exactly <strong>${requiredSelections}</strong> candidate${requiredSelections !== 1 ? 's' : ''} from the list below.</p>
            </div>
            <div style="background: var(--bg); padding: 1.25rem 2rem; border-radius: 16px; border: 2px solid var(--border); text-align: center; min-width: 140px; transition: all 0.3s;" id="selection-counter-box">
              <div style="font-size: 0.65rem; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">Selected</div>
              <div style="font-size: 2.5rem; font-family: 'Fira Code', monospace; font-weight: 700; line-height: 1; color: var(--primary);">
                <span id="selection-count">0</span><span style="font-size: 1rem; color: var(--text-muted); font-weight: 400;"> / ${requiredSelections}</span>
              </div>
              <div id="selection-status-msg" style="font-size: 0.75rem; margin-top: 0.5rem; color: var(--text-muted);">Select ${requiredSelections} more</div>
            </div>
          </div>
        </div>

        <!-- Candidate Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem;" id="candidates-list">
          ${candidates.map((c: any, idx: number) => `
            <div class="candidate-item" id="candidate-${c.id}" onclick="toggleCandidate('${c.id}')"
              style="padding: 1.25rem; border: 2px solid var(--border); border-radius: 16px; background: white; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 1rem; position: relative; overflow: hidden;">
              <div class="candidate-number" style="width: 40px; height: 40px; font-size: 1rem; flex-shrink: 0;">${idx + 1}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem; color: var(--text);">${c.name}</div>
                <div class="text-xs text-muted">${c.description || 'No description provided.'}</div>
              </div>
              <div class="checkbox-indicator" style="width: 24px; height: 24px; border: 2px solid var(--border); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s;">
                <svg id="check-${c.id}" style="display: none;" width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 5 9 10 3"></polyline></svg>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Submit Area -->
        <div class="card" style="padding: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; background: linear-gradient(to right, #f8fafc, #f0f7ff); border: 1px solid #dbeafe;">
          <div style="max-width: 400px;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span style="font-weight: 700; font-size: 0.9rem; color: #1e40af;">Secure & Anonymous Ballot</span>
            </div>
            <p class="text-sm text-muted" style="margin: 0; line-height: 1.5;">Your vote will be cryptographically hashed and added to the immutable audit chain. Your identity is never linked to your choices.</p>
          </div>
          <button id="submit-ballot" disabled onclick="submitBallot('${electionId}')" style="min-width: 220px; padding: 1rem 2rem; font-weight: 700; font-size: 1rem; background: var(--primary); border-radius: 12px; opacity: 0.5; cursor: not-allowed; transition: all 0.3s;">
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
        el.style.borderColor = 'var(--border)';
        el.style.background = 'white';
        el.style.boxShadow = 'none';
        check.style.display = 'none';
        indicator.style.background = 'transparent';
        indicator.style.borderColor = 'var(--border)';
      } else {
        if (selected.length < requiredSelections) {
          selected.push(cid);
          el.style.borderColor = 'var(--primary)';
          el.style.background = '#f0f7ff';
          el.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
          check.style.display = 'block';
          indicator.style.background = 'var(--primary)';
          indicator.style.borderColor = 'var(--primary)';
          indicator.style.color = 'white';
        }
      }

      const count = selected.length;
      document.getElementById('selection-count')!.innerText = count.toString();
      const remaining = requiredSelections - count;
      const statusMsg = document.getElementById('selection-status-msg')!;
      const counterBox = document.getElementById('selection-counter-box')!;
      const btn = document.getElementById('submit-ballot') as HTMLButtonElement;
      
      if (count === requiredSelections) {
        statusMsg.innerText = '✓ Ready to cast';
        statusMsg.style.color = 'var(--success)';
        counterBox.style.borderColor = 'var(--success)';
        (document.getElementById('selection-count') as HTMLElement).style.color = 'var(--success)';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      } else {
        statusMsg.innerText = `Select ${remaining} more`;
        statusMsg.style.color = 'var(--text-muted)';
        counterBox.style.borderColor = 'var(--border)';
        (document.getElementById('selection-count') as HTMLElement).style.color = 'var(--primary)';
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }
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
