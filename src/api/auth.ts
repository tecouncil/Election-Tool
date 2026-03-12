import { IRequest, Router, error, json } from 'itty-router';
import { Env } from '../index';
import { generateOTP, sendEmail } from '../utils/email';
import { DBWrapper } from '../db';

export const authRouter = Router<IRequest, [Env, ExecutionContext]>({ base: '/api/auth' });

authRouter.post('/otp/request', async (req, env) => {
  console.log('[OTP Request] Starting handler');
  try {
    let body: any = {};
    try {
      const text = await req.text();
      console.log('[OTP Request] Raw body text:', text);
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('[OTP Request] Failed to parse body:', e);
    }
    
    const email = body.email?.toLowerCase().trim();
    const electionId = body.electionId;
    const isAdminLogin = body.isAdminLogin === true;
    console.log(`[OTP Request] email: ${email}, isAdmin: ${isAdminLogin}`);

    if (!email) {
      return error(400, 'Email required');
    }

    // Basic rate limiting via KV (max 5 requests per 15 mins)
    const rateLimitKey = `rl:${email}`;
    console.log('[OTP Request] Fetching rate limit from KV...');
    const rateLimitVal = await env.KV.get(rateLimitKey);
    console.log('[OTP Request] Rate limit value:', rateLimitVal);
    
    let rateLimitData = rateLimitVal ? JSON.parse(rateLimitVal) : { count: 0, firstAttempt: Date.now() };
    const now = Date.now();
    if (now - rateLimitData.firstAttempt > 900000) {
      rateLimitData = { count: 1, firstAttempt: now };
    } else {
      rateLimitData.count++;
    }
    
    if (rateLimitData.count > 5) {
      return error(429, 'Too many OTP requests. Try again in 15 minutes.');
    }
    console.log('[OTP Request] Updating rate limit in KV...');
    await env.KV.put(rateLimitKey, JSON.stringify(rateLimitData), { expirationTtl: 900 });

    // Lockout check (5 failed attempts) lockout key in KV
    const lockoutKey = `lockout:${email}`;
    console.log('[OTP Request] Checking lockout in KV...');
    const isLockedOut = await env.KV.get(lockoutKey);
    console.log('[OTP Request] Lockout status:', isLockedOut);
    if (isLockedOut) {
      return error(429, 'Account temporarily locked out due to too many failed attempts.');
    }

    let role = 'voter';

    if (isAdminLogin) {
      if (env.ADMIN_EMAIL && email !== env.ADMIN_EMAIL.toLowerCase()) {
        console.log('[OTP Request] Admin email mismatch');
        return error(403, 'Unauthorized'); 
      }
      role = 'admin';
    } else {
      if (!electionId) {
        console.log('[OTP Request] Missing electionId for voter');
        return error(400, 'Election ID required for voter login');
      }
      
      console.log('[OTP Request] DBWrapper init for electionId:', electionId);
      const db = new DBWrapper(env.DB);
      console.log('[OTP Request] Fetching election status...');
      const election = await db.getElection(electionId);
      console.log('[OTP Request] Election result:', !!election);
      
      if (!election || election.status !== 'open') {
        return error(400, 'Election is not open');
      }
    }

    const otp = generateOTP();
    const otpKey = isAdminLogin ? `otp:admin:${email}` : `otp:${electionId}:${email}`;
    console.log('[OTP Request] Storing OTP in KV with key:', otpKey);

    await env.KV.put(otpKey, otp, { expirationTtl: 600 });
    console.log('[OTP Request] OTP stored');
    await env.KV.put(`attempts_count:${otpKey}`, '0', { expirationTtl: 600 });
    console.log('[OTP Request] attempts_count stored');

    // Send Email
    console.log('[OTP Request] Preparing email...');
    const title = isAdminLogin ? 'Admin Login' : 'Voter Login';
    try {
      console.log('[OTP Request] Calling sendEmail utility...');
      await sendEmail(env, email, `${title} Verification Code`, `
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
      `);
      console.log('[OTP Request] Email utility returned success');
    } catch (emailErr: any) {
      console.error('[OTP Request] Email utility threw error:', emailErr.stack || emailErr.message);
      throw emailErr;
    }

    console.log('[OTP Request] Success returning json');
    return json({ success: true, message: 'OTP sent' });
  } catch (err: any) {
    console.error('[OTP Request] CRITICAL HANDLER ERROR:', err.stack || err.message || err);
    return error(500, `Internal Error in OTP Request: ${err.message}`);
  }
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
