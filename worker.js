// Runs on Cloudflare's edge BEFORE serving static assets. Only job: stop
// someone from typing a login-only tool's URL directly in the address bar
// and skipping the login flow entirely. Everything else passes straight
// through to normal static-asset serving (including the SPA fallback for
// the React app's client-side routes).
//
// NOTE on what this does and doesn't protect: checks for a plain
// "aft_session" marker cookie set by AuthContext.jsx on THIS domain
// (alifaisal.trade) after a successful login -- NOT the real refreshToken
// cookie, which is httpOnly and scoped to api.alifaisal.trade/api/auth
// only and never reaches this domain at all. This is a presence check,
// not cryptographic validity, matching the same trust level as the rest
// of the frontend's client-side route guards (ProtectedRoute.jsx) -- a UX
// gate, not a security boundary. The real security boundary is unchanged:
// tools only call public market-data APIs (no account data involved), and
// anything that DOES touch account data (bots, exchange keys, trades) is
// protected by the backend's own JWT verification on every request,
// independent of this file.
//
// Which tools are gated vs public: 3 tools (Sector Screener, Confluence
// Dashboard, Position Size Calculator) are intentionally public/no-login
// -- they're linked from the public marketing homepage as free try-it-now
// demos. The other 10 tools were built later as part of the full-suite
// port and are only ever linked from the login-gated dashboard, so they
// need the same gate as /aft-tools-suite.html or anyone could bypass
// login by typing their URL directly.
const GATED_TOOLS = [
  'aft-tools-suite',
  'trend-screener',
  'futures-screener',
  'volume-profile',
  'anchor-vwap',
  'confluence-zones',
  'order-flow',
  'fibonacci-levels',
  'rsi-checker',
  'cipher-b-checker',
  'lakhsmi-signals',
  'rsi-screener',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Cloudflare's static-asset serving auto-strips the .html extension from
    // the browser-visible URL (so /order-flow.html shows as just
    // /order-flow) -- checking only the exact .html path let the
    // extensionless form bypass this check entirely. Match both forms for
    // every gated tool.
    const pathNoExt = url.pathname.replace(/\.html$/, '').replace(/^\//, '');
    if (GATED_TOOLS.includes(pathNoExt)) {
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
