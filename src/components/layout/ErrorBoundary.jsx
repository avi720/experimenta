import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";

/**
 * Catches render errors in its subtree, logs them, and renders `fallback({ error, reset })`.
 * The boundary resets itself when `resetKey` changes (e.g. on navigation).
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Render error caught:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error, reset: this.reset });
    }
    return this.props.children;
  }
}

function FallbackCard({ isRTL, onRetry, onHome }) {
  const { t, dir } = useTranslation(isRTL);
  return (
    <div className="flex items-center justify-center px-4 py-24" dir={dir} role="alert">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-slate-900 mb-2">{t("errors.pageCrashTitle")}</h1>
        <p className="text-slate-600 mb-6">{t("errors.pageCrashBody")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw className="w-4 h-4 me-2" aria-hidden="true" />
            {t("common.tryAgain")}
          </Button>
          <Button onClick={onHome}>
            <Home className="w-4 h-4 me-2" aria-hidden="true" />
            {t("common.backToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Fallback for a page that crashed inside the router; navigates home without a full reload. */
export function PageErrorFallback({ isRTL, reset }) {
  const navigate = useNavigate();
  const goHome = () => {
    reset();
    navigate("/");
  };
  return <FallbackCard isRTL={isRTL} onRetry={reset} onHome={goHome} />;
}

/** Last-resort fallback outside the router (e.g. the header itself crashed); reloads the app. */
export function AppErrorFallback() {
  return (
    <div className="min-h-screen bg-slate-50">
      <FallbackCard
        onRetry={() => window.location.reload()}
        onHome={() => window.location.assign("/")}
      />
    </div>
  );
}
