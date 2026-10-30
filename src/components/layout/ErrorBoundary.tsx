import { Component, type ErrorInfo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import type { ErrorFallbackProps, IsRTLProps } from "@/types/props";

type ErrorBoundaryProps = {
  children?: ReactNode;
  fallback: (props: ErrorFallbackProps) => ReactNode;
  resetKey?: unknown;
};

type ErrorBoundaryState = { error: unknown };

/**
 * Catches render errors in its subtree, logs them, and renders `fallback({ error, reset })`.
 * The boundary resets itself when `resetKey` changes (e.g. on navigation).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[ErrorBoundary] Render error caught:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
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

type FallbackCardProps = IsRTLProps & { onRetry: () => void; onHome: () => void };

function FallbackCard({ isRTL, onRetry, onHome }: FallbackCardProps) {
  const { t, dir } = useTranslation(isRTL);
  return (
    <div className="flex items-center justify-center px-4 sm:px-6 py-24" dir={dir} role="alert">
      <div className="max-w-lg w-full border border-line bg-space-raised/60 px-6 py-10 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/10">
            <AlertTriangle className="w-5 h-5 text-amber-300" aria-hidden="true" />
          </span>
          <h1 className="text-[22px] font-light leading-snug text-star">{t("errors.pageCrashTitle")}</h1>
        </div>
        <p className="mt-4 text-[17px] leading-[1.7] text-dust">{t("errors.pageCrashBody")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={onRetry} className="focus-ring h-11 px-5 text-[15px] font-medium hover:bg-plasma-hi">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {t("common.tryAgain")}
          </Button>
          <Button
            variant="outline"
            onClick={onHome}
            className="focus-ring h-11 px-5 text-[15px] border-line bg-transparent text-star hover:bg-transparent hover:text-star hover:border-blueshift"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            {t("common.backToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Fallback for a page that crashed inside the router; navigates home without a full reload. */
export function PageErrorFallback({ isRTL, reset }: IsRTLProps & Pick<ErrorFallbackProps, "reset">) {
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
    <div className="min-h-screen bg-space">
      <FallbackCard
        onRetry={() => window.location.reload()}
        onHome={() => window.location.assign("/")}
      />
    </div>
  );
}
