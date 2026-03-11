import { IRequest, Router, error, json } from 'itty-router';
import { Env } from '../index';
import { generateOTP, sendEmail } from '../utils/email';
import { DBWrapper } from '../db';

export const authRouter = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/auth' });

// POST /api/auth/otp/request
authRouter.post('/otp/request', async (req, env) => {
  const body = await req.json().catch(() => ({}));
  const email = (body as any).email?.toLowerCase().trim();
  const electionId = (body as any).electionId; // optional if admin login?
  const isAdminLogin = (body as any).isAdminLogin === true;

  if (!email) {
    return error(400, 'Email required');
  }

  // Rate Limiting check via DO
  const id = env.RATE_LIMITER.idFromName(email);
  const limiter = env.RATE_LIMITER.get(id);
  const rateLimitReq = new Request(`http://do/?email=${encodeURIComponent(email)}`);
  const rateLimitRes = await limiter.fetch(rateLimitReq);
  
  if (rateLimitRes.status === 429) {
    return error(429, 'Too many OTP requests. Try again in 15 minutes.');
  }

  // Lockout check (5 failed attempts) lockout key in KV
  const lockoutKey = `lockout:${email}`;
  const isLockedOut = await env.KV.get(lockoutKey);
  if (isLockedOut) {
    return error(429, 'Account temporarily locked out due to too many failed attempts.');
  }

  let role = 'voter';

  if (isAdminLogin) {
    if (env.ADMIN_EMAIL && email !== env.ADMIN_EMAIL.toLowerCase()) {
      return error(403, 'Unauthorized'); // Do not leak if admin or not
    }
    role = 'admin';
  } else {
    // Voter login - check if voter is on roll OR election is open?
    // User requested: "Anyone with the link can enter their email to request an OTP and log in to vote"
    // So we don't necessarily PRE-check voter roll, but wait!
    // "Instead of the admin pre-adding voters to a voter roll before opening... Anyone with the link can enter their email... to request OTP and log in to vote"
    // This implies Open Voter Access. We just accept the email, but we need an electionId.
    if (!electionId) return error(400, 'Election ID required for voter login');
    
    const db = new DBWrapper(env.DB);
    const election = await db.getElection(electionId);
    
    if (!election || election.status !== 'open') {
      return error(400, 'Election is not open');
    }
    
    // Check if already voted? (Optional, but good UX to tell them early or just let them login and see a "you already voted" page)
  }

  const otp = generateOTP();
  const otpKey = isAdminLogin ? `otp:admin:${email}` : `otp:${electionId}:${email}`;

  // Store OTP in KV with 10 min TTL
  await env.KV.put(otpKey, otp, { expirationTtl: 600 });
  await env.KV.put(`attempts_count:${otpKey}`, '0', { expirationTtl: 600 }); // track failed attempts

  // Send Email
  const title = isAdminLogin ? 'Admin Login' : 'Voter Login';
  await sendEmail(env, email, `${title} Verification Code`, `
    <p>Your verification code is: <strong>${otp}</strong></p>
    <p>This code expires in 10 minutes.</p>
  `);

  return json({ success: true, message: 'OTP sent' });
});

// POST /api/auth/otp/verify
authRouter.post('/otp/verify', async (req, env) => {
  const body = await req.json().catch(() => ({}));
  const email = (body as any).email?.toLowerCase().trim();
  const electionId = (body as any).electionId;
  const code = (body as any).code?.trim();
  const isAdminLogin = (body as any).isAdminLogin === true;

  if (!email || !code) return error(400, 'Email and code required');

  const lockoutKey = `lockout:${email}`;
  if (await env.KV.get(lockoutKey)) {
    return error(429, 'Account temporarily locked out');
  }

  const otpKey = isAdminLogin ? `otp:admin:${email}` : `otp:${electionId}:${email}`;
  const storedOtp = await env.KV.get(otpKey);

  if (!storedOtp) {
    return error(400, 'OTP expired or invalid');
  }

  if (storedOtp !== code) {
    // Increment attempts
    const attemptKey = `attempts_count:${otpKey}`;
    let attempts = parseInt(await env.KV.get(attemptKey) || '0', 10);
    attempts++;
    
    if (attempts >= 5) {
      await env.KV.put(lockoutKey, '1', { expirationTtl: 900 }); // 15 min lockout
      await env.KV.delete(otpKey);
      await env.KV.delete(attemptKey);
      return error(429, 'Too many failed attempts. Locked out for 15 minutes.');
    } else {
      await env.KV.put(attemptKey, attempts.toString(), { expirationTtl: 600 });
      return error(400, 'Invalid OTP');
    }
  }

  // OTP verified! Generate token
  await env.KV.delete(otpKey);
  const token = crypto.randomUUID();
  const sessionData = {
    email,
    role: isAdminLogin ? 'admin' : 'voter',
    electionId: isAdminLogin ? null : electionId,
  };

  // 2 hour TTL
  await env.KV.put(`session:${token}`, JSON.stringify(sessionData), { expirationTtl: 7200 });

  return json({ success: true, token, role: sessionData.role });
});

// GET /api/auth/session
authRouter.get('/session', async (req, env) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(401, 'Unauthorized');
  }
  
  const token = authHeader.split(' ')[1];
  const sessionStr = await env.KV.get(`session:${token}`);
  if (!sessionStr) {
    return error(401, 'Session expired or invalid');
  }

  return json({ session: JSON.parse(sessionStr) });
});
