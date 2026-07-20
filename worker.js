// Runs on Cloudflare's edge BEFORE serving static assets. Only job: stop
// someone from typing /aft-tools-suite.html directly in the address bar
// and skipping the login flow entirely. Everything else passes straight
// through to normal static-asset serving (including the SPA fallback for
// the React app's client-side routes).
//
// NOTE on what this does and doesn't protect: checks for a plain
// "aft_session" marker cookie set by AuthContext.jsx on THIS domain
// (alifaisal.trade) after a successful login -- NOT the real refreshToken
// cookie, which is httpOnly and scoped to api.alifaisal.trade/api/auth
// only and never reaches this domain at all (that's why the first version
// of this check always failed). This is a presence check, not
// cryptographic validity, matching the same trust level as the rest of
// the frontend's client-side route guards (ProtectedRoute.jsx) -- a UX
// gate, not a security boundary. The real security boundary is unchanged:
// tools only call public market-data APIs (no account data involved), and
// anything that DOES touch account data (bots, exchange keys, trades) is
// protected by the backend's own JWT verification on every request,
// independent of this file.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/aft-tools-suite.html') {
      const cookieHeader = request.headers.get('Cookie') || '';
      const hasSession = cookieHeader
        .split(';')
        .some((c) => c.trim().startsWith('aft_session='));

      if (!hasSession) {
        return Response.redirect(new URL('/login', url.origin).toString(), 302);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
