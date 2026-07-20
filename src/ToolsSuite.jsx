import { useEffect } from 'react';

// The real AFT Tools website (all 15 tools, its own internal navigation,
// exact same design/behavior) served as a static file. This page's only
// job is the auth check (via ProtectedRoute, already applied by the router)
// -- once that passes, it does a genuine full-page navigation to the real
// file (not an iframe), so the URL, browser back/forward, and page-to-page
// feel all match native navigation. A Cloudflare Worker gatekeeper
// (worker.js) also blocks direct access to that URL without a session
// cookie present, in case someone skips this page and types the URL
// directly.
export default function ToolsSuite() {
  useEffect(() => {
    window.location.replace('/aft-tools-suite.html');
  }, []);

  return <div className="center-loading">Opening tools&hellip;</div>;
}
