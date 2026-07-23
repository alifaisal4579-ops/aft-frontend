import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// gtag's default config() call only fires a page_view for the very first
// page load. Everything after that is client-side routing (no full page
// reload), so without this, GA would only ever see one page_view no matter
// how many pages someone visits in a session.
export default function AnalyticsRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);

  return null;
}
