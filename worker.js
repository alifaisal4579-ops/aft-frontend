// Runs on Cloudflare's edge BEFORE serving static assets. Only job: stop
// someone from typing /aft-tools-suite.html directly in the address bar
// and skipping the login flow entirely. Everything else passes straight
// through to normal static-asset serving (including the SPA fallback for
// the React app's client-side routes).
//
// NOTE on what this does and doesn't protect: this checks for the mere
// PRESENCE of the refreshToken cookie, not its cryptographic validity --
// that matches the same trust level as the rest of the frontend's
// client-side route guards (ProtectedRoute.jsx), which are a UX gate, not
// a security boundary. The real security boundary is unchanged: every
// data-fetching call from the tools still goes to public market-data APIs
// directly (no account data involved), and anything that DOES touch
// account data (bots, exchange keys, trades) is protected by the backend's
// own JWT verification on every request, independent of this file. This
// stops casual "just type the URL" bypass without adding a network
// round-trip on every tools-suite.html load.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/aft-tools-suite.html') {
      const cookieHeader = request.headers.get('Cookie') || '';
      const hasSession = cookieHeader
        .split(';')
        .some((c) => c.trim().startsWith('refreshToken='));

      if (!hasSession) {
        return Response.redirect(new URL('/login', url.origin).toString(), 302);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
