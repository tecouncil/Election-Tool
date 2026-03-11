import { IRequest, Router, error, json, cors } from 'itty-router';

// Define environment interface
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  ADMIN_EMAIL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}

import { authRouter } from './api/auth';
import { electionsRouter } from './api/elections';
import { candidatesRouter } from './api/candidates';
import { votersRouter } from './api/voters';
import { ballotsRouter } from './api/ballots';
import { auditRouter } from './api/audit';
import { verifyRouter } from './api/verify';

const { preflight, corsify } = cors();

const router = Router<IRequest, [Env, ExecutionContext]>();

// Apply preflight CORS
router.all('*', preflight);

router.get('/api/health', () => json({ status: 'ok' }));

// Mount sub-routers
router.all('/api/auth/*', authRouter.handle);
router.all('/api/elections/:id/candidates/*', candidatesRouter.handle);
router.all('/api/elections/:id/voters/*', votersRouter.handle);
router.all('/api/elections/:id/*', ballotsRouter.handle);
router.all('/api/elections/*', electionsRouter.handle);
router.all('/api/audit/*', auditRouter.handle);
router.all('/api/verify/*', verifyRouter.handle);

// 404 handler
router.all('*', () => error(404, 'Not Found'));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx)
      .then(corsify)
      .catch((err: any) => {
        console.error('Unhandled error', err);
        return corsify(error(500, err instanceof Error ? err.message : 'Internal Server Error'));
      });
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
    // Basic rate limiter: max 5 requests per 15 mins per email
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    if (!email) return new Response('Missing email', { status: 400 });

    const key = `attempts:${email}`;
    // We can store an array of timestamps in DO storage
    let attempts = await this.state.storage.get<number[]>(key) || [];
    
    // Filter attempts within the last 15 minutes (900000 ms)
    const now = Date.now();
    attempts = attempts.filter(ts => ts > now - 900000);
    
    if (attempts.length >= 5) {
      return new Response('Rate limited', { status: 429 });
    }

    attempts.push(now);
    await this.state.storage.put(key, attempts);

    return new Response('OK', { status: 200 });
  }
}
