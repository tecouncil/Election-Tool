import { router } from './router';
import { renderHeader } from './utils/api';
import { renderAdminLogin, renderAdminDashboard, renderAdminElectionEdit } from './pages/admin';
import { renderVoterLogin, renderBallot, renderConfirmation } from './pages/voter';
import { renderResults, renderAuditLog, renderVerify } from './pages/public';

// Register routes
router.add('/', () => {
  const app = document.getElementById('app');
  if (app) app.innerHTML = `
    ${renderHeader()}
    <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto; padding: 2rem 1rem;">
      <div class="card text-center" style="padding: 4rem 2rem; border-bottom: 4px solid var(--primary); background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent);">
        <h1 style="font-size: 3.5rem; margin-bottom: 1rem; letter-spacing: -0.02em;">TEC Election Portal</h1>
        <p class="text-muted" style="font-size: 1.25rem; max-width: 700px; margin: 0 auto 2.5rem auto;">Building a sustainable community of technology entrepreneurs. A secure and cryptographically verifiable platform for the <strong>Technology Entrepreneurs’ Council</strong>.</p>
        
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button style="padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600;" onclick="navigate('/verify')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Verify a Ballot
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 3rem;">
        <div class="card" style="padding: 1.5rem;">
          <div style="color: var(--primary); margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
          <h3 style="margin-bottom: 0.5rem;">End-to-End Encryption</h3>
          <p class="text-sm text-muted">Your vote is encrypted at the source, ensuring that even administrators cannot link your identity to your choices.</p>
        </div>
        <div class="card" style="padding: 1.5rem;">
          <div style="color: var(--success); margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
          <h3 style="margin-bottom: 0.5rem;">Real-time Auditing</h3>
          <p class="text-sm text-muted">A transparent, append-only ledger tracks every action in the system, providing a complete trail for post-election review.</p>
        </div>
        <div class="card" style="padding: 1.5rem;">
          <div style="color: var(--cta); margin-bottom: 1rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
          <h3 style="margin-bottom: 0.5rem;">Verified Integrity</h3>
          <p class="text-sm text-muted">Every voter receives a digital receipt holding a cryptographic proof that their specific ballot was counted accurately.</p>
        </div>
      </div>

      <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
        <a href="https://github.com/tecouncil/Election-Tool" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          Audit Source Code
        </a>
        <a href="https://tecouncil.org/" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          TEC Website
        </a>
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
