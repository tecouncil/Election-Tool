import { IRequest, error } from 'itty-router';
import { Env } from '../index';

export type AuthenticatedRequest = IRequest & {
  session?: {
    email: string;
    role: 'admin' | 'voter';
    electionId: string | null;
  }
};

export const requireAuth = async (req: AuthenticatedRequest, env: Env, ctx: ExecutionContext) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(401, 'Unauthorized');
  }
  
  const token = authHeader.split(' ')[1];
  const sessionStr = await env.KV.get(`session:${token}`);
  
  if (!sessionStr) {
    return error(401, 'Session expired');
  }

  req.session = JSON.parse(sessionStr);
};

export const requireAdmin = async (req: AuthenticatedRequest, env: Env, ctx: ExecutionContext) => {
  const authRes = await requireAuth(req, env, ctx);
  if (authRes) return authRes; // if errorResponse was returned

  if (!req.session || req.session.role !== 'admin') {
    return error(403, 'Forbidden: Admin access required');
  }
};

export const requireVoter = async (req: AuthenticatedRequest, env: Env, ctx: ExecutionContext) => {
  const authRes = await requireAuth(req, env, ctx);
  if (authRes) return authRes;

  if (!req.session || req.session.role !== 'voter') {
    return error(403, 'Forbidden: Voter access required');
  }
};
