import { Link } from 'react-router-dom';

// The real AFT Tools website (all 15 tools, its own internal navigation,
// exact same design/behavior) served as a static file and embedded here
// behind login. This replaces the earlier tool-by-tool manual React ports
// (RsiScreenerPage.jsx, OrderFlowPage.jsx) as the primary way tools are
// accessed -- guaranteed 100% visual/functional fidelity since it's
// literally the same file, not a recreation of it.
export default function ToolsSuite() {
  return (
    <div className="tools-suite-wrap">
      <div className="tools-suite-bar">
        <Link to="/dashboard" className="back-link">&larr; Back to Dashboard</Link>
      </div>
      <iframe
        src="/aft-tools-suite.html"
        title="AFT Tools"
        className="tools-suite-frame"
      />
    </div>
  );
}
