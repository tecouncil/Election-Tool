import { IRequest, Router, error, json, cors } from 'itty-router';

// Define environment interface
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  ADMIN_EMAIL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  ASSETS?: { fetch: typeof fetch };
}

import { authRouter } from './api/auth';
import { electionsRouter } from './api/elections';
import { candidatesRouter } from './api/candidates';
import { ballotsRouter } from './api/ballots';
import { auditRouter } from './api/audit';
import { verifyRouter } from './api/verify';

const { preflight, corsify } = cors();

const router = Router<IRequest, [Env, ExecutionContext]>();

// Apply preflight CORS
router.all('*', preflight);

router.get('/api/health', () => json({ status: 'ok' }));

// Mount sub-routers
router.all('/api/auth/*', (req, env, ctx) => {
  console.log('[Routing] Passing to authRouter...');
  return authRouter.fetch(req, env, ctx).catch((err: any) => {
    console.error('[Routing] authRouter threw error:', err);
    throw err;
  });
});
router.all('/api/elections/:id/candidates/*', (req, env, ctx) => candidatesRouter.fetch(req, env, ctx));
router.all('/api/elections/:id/*', (req, env, ctx) => ballotsRouter.fetch(req, env, ctx));
router.all('/api/elections/*', (req, env, ctx) => electionsRouter.fetch(req, env, ctx));
router.all('/api/audit/*', (req, env, ctx) => auditRouter.fetch(req, env, ctx));
router.all('/api/verify/*', (req, env, ctx) => verifyRouter.fetch(req, env, ctx));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    console.log(`[Fetch Start] ${request.method} ${request.url}`);
    
    // Binding Health Check
    try {
      console.log('[Startup Check] KV:', !!env.KV);
      console.log('[Startup Check] DB:', !!env.DB);
      console.log('[Startup Check] ASSETS:', !!env.ASSETS);
      console.log('[Startup Check] ADMIN_EMAIL:', !!env.ADMIN_EMAIL);
      console.log('[Startup Check] RATE_LIMITER:', !!env.RATE_LIMITER);
    } catch (e) {
      console.error('[CRITICAL BINDING ERROR]', e);
    }
    
    try {
      // Try to handle API/Routing
      console.log('[Fetch] Before router.fetch');
      let response = await router.fetch(request, env, ctx);
      console.log('[Fetch] After router.fetch:', !!response);

      // If no response from router, fallback to assets
      if (!response) {
        if (env.ASSETS) {
          console.log('[Asset Fallback] Fetching from ASSETS...');
          response = await env.ASSETS.fetch(request);
        } else {
          console.log('[Routing Fallback] No router match and no ASSETS binding');
          response = error(404, 'Not Found');
        }
      }

      console.log(`[Response Success] status: ${response.status}`);
      return corsify(response);

    } catch (err: any) {
      console.error('[CRITICAL FETCH ERROR]', err.stack || err.message || err);
      const errRes = error(500, `Internal Server Error: ${err.message || 'unknown'}`);
      return corsify(errRes);
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Auto-close elections whose voting_window_end has passed
    const now = new Date().toISOString();
    const res = await env.DB.prepare(
      "UPDATE elections SET status = 'closed' WHERE status = 'open' AND voting_window_end IS NOT NULL AND voting_window_end < ?"
    ).bind(now).run();

    if (res.meta.changes > 0) {
      console.log(`Auto-closed ${res.meta.changes} election(s) via cron`);
    }
  }
};

// Durable Object for Rate Limiting OTP Requests
export class RateLimiter {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request) {
    console.log(`[RateLimiter DO] fetch: ${request.url}`);
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    if (!email) return new Response('Missing email', { status: 400 });

    const key = `attempts:${email}`;
    const now = Date.now();
    
    // Use the DO storage to get attempts
    let attempts = await this.state.storage.get<number[]>(key) || [];
    
    // Filter attempts within the last 15 minutes
    attempts = attempts.filter(ts => ts > now - 900000);
    
    if (attempts.length >= 5) {
      console.log(`[RateLimiter DO] Rate limited for ${email}`);
      return new Response('Rate limited', { status: 429 });
    }

    attempts.push(now);
    await this.state.storage.put(key, attempts);
    
    console.log(`[RateLimiter DO] OK for ${email} (${attempts.length} attempts)`);
    return new Response('OK', { status: 200 });
  }
}
