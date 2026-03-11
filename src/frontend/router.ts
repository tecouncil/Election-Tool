import { apiFetch, clearToken } from './utils/api';

// Simple Router
export class Router {
  routes: { path: RegExp, handler: (params: any) => void }[] = [];

  constructor() {
    window.addEventListener('popstate', () => this.route());
  }

  add(pathStr: string, handler: (params: any) => void) {
    // Convert path like /vote/:id to regex
    const regexStr = pathStr.replace(/:[a-zA-Z]+/g, '([^/]+)');
    const regex = new RegExp(`^${regexStr}$`);
    this.routes.push({ path: regex, handler });
  }

  navigate(path: string) {
    window.history.pushState({}, '', path);
    this.route();
  }

  route() {
    const path = window.location.pathname;
    const app = document.getElementById('app');
    if (!app) return;

    for (const r of this.routes) {
      const match = path.match(r.path);
      if (match) {
        const params = match.slice(1);
        app.innerHTML = 'Loading...';
        r.handler(params);
        return;
      }
    }

    app.innerHTML = `<h1>404 Not Found</h1><button onclick="window.history.back()">Go Back</button>`;
  }
}

export const router = new Router();

// To be called from HTML onclick
(window as any).navigate = (path: string) => router.navigate(path);
(window as any).logout = () => {
    clearToken();
    router.navigate('/');
};
