import { router } from './router';
import { renderAdminLogin, renderAdminDashboard, renderAdminElectionEdit } from './pages/admin';
import { renderVoterLogin, renderBallot, renderConfirmation } from './pages/voter';
import { renderResults, renderAuditLog, renderVerify } from './pages/public';

// Register routes
router.add('/', () => {
  const app = document.getElementById('app');
  if (app) app.innerHTML = `
    <div style="text-align: center; max-width: 600px; margin: 4rem auto;" class="card">
      <h1>TEC EC Election</h1>
      <p>Welcome to the secure, anonymous election system.</p>
      <div class="flex flex-col gap-4 mt-4">
        <button onclick="navigate('/verify')">Verify a Ballot</button>
        <button onclick="navigate('/admin/login')" style="background-color: var(--text-muted);">Admin Login</button>
      </div>
    </div>
  `;
});

router.add('/admin/login', renderAdminLogin);
router.add('/admin', renderAdminDashboard);
router.add('/admin/elections/:id', renderAdminElectionEdit);

router.add('/vote/:id', renderVoterLogin);
router.add('/vote/:id/ballot', renderBallot);
router.add('/vote/:id/confirm', renderConfirmation);

router.add('/results/:id', renderResults);
router.add('/audit/:id', renderAuditLog);
router.add('/verify', renderVerify);

// Run router on load
router.route();
