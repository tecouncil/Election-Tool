import { apiFetch, setToken } from '../utils/api';
import { router } from '../router';

export function renderVoterLogin(params: string[]) {
  const electionId = params[0];
  const app = document.getElementById('app')!;

  app.innerHTML = `
    <div class="card" style="max-width: 400px; margin: 4rem auto;">
      <h2>Voter Login</h2>
      <p class="text-muted text-sm">You must enter the email address authorized for this election.</p>
      <div id="login-error" class="error"></div>
      <div id="login-step-1">
        <label>Email Address</label>
        <input type="email" id="voter-email" placeholder="voter@example.com" />
        <button onclick="requestVoterOTP('${electionId}')">Send OTP</button>
      </div>
      <div id="login-step-2" style="display:none;">
        <label>Verification Code</label>
        <input type="text" id="voter-otp" placeholder="123456" />
        <button onclick="verifyVoterOTP('${electionId}')">Login & Vote</button>
      </div>
    </div>
  `;

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
      <div class="card">
        <h2>${election.title} - Official Ballot</h2>
        <p>Instructions: You must select exactly <strong>${requiredSelections}</strong> candidates.</p>
        <p>Selected: <span id="selection-count">0</span> / ${requiredSelections}</p>
      </div>
      <div id="candidates-list">
        ${candidates.map((c: any) => `
          <div class="candidate-item" id="candidate-${c.id}" onclick="toggleCandidate('${c.id}')">
            <input type="checkbox" id="checkbox-${c.id}" />
            <div>
              <strong>${c.name}</strong>
              <div class="text-sm text-muted">${c.description || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="card mt-4">
        <button id="submit-ballot" disabled onclick="submitBallot('${electionId}')">Cast Ballot</button>
        <div id="ballot-error" class="error mt-2"></div>
      </div>
    `;

    (window as any).toggleCandidate = (cid: string) => {
      const idx = selected.indexOf(cid);
      const el = document.getElementById(`candidate-${cid}`)!;
      const cb = document.getElementById(`checkbox-${cid}`) as HTMLInputElement;

      if (idx > -1) {
        selected.splice(idx, 1);
        el.classList.remove('selected');
        cb.checked = false;
      } else {
        if (selected.length < requiredSelections) {
          selected.push(cid);
          el.classList.add('selected');
          cb.checked = true;
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
    <div class="card" style="text-align:center; max-width:600px; margin: 4rem auto;">
      <h2 class="success">Vote Cast Successfully</h2>
      <p>Thank you for participating.</p>
      
      <div style="text-align:left; background:#f3f4f6; padding:1rem; border-radius:8px; margin-top:2rem; word-break:break-all; font-family:monospace; font-size:0.875rem;">
        <strong>Your Ballot Hash (Save this for verification):</strong><br/>
        ${receipt.ballotHash}
        <br/><br/>
        <strong>Timestamp:</strong><br/>
        ${new Date(receipt.timestamp).toLocaleString()}
      </div>

      <button style="margin-top:2rem;" onclick="navigate('/')">Return Home</button>
    </div>
  `;
}
