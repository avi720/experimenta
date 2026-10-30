import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation, translate, resolveLocale, type LocaleInput } from "@/i18n";
import { User } from "@/entities/User";
import BlackHoleMark from "@/components/brand/BlackHoleMark";

const MIN_PASSWORD_LENGTH = 6;

// Only allow same-origin relative redirects.
const safeRedirect = (value: string | null): string => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/");

// OAuth failures come back as error_description in the query string or the hash.
const oauthErrorFromUrl = () => {
  if (typeof window === "undefined") return "";
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.get("error_description") || queryParams.get("error_description") || "";
};

const errorMessageOf = (err: unknown): string =>
  err && typeof err === "object" && "message" in err && typeof err.message === "string" ? err.message : "";

/**
 * Translates raw Supabase Auth error messages into localized user-facing strings.
 */
export function localizeAuthError(errOrMessage: unknown, localeOrIsRTL: LocaleInput = "he"): string {
  const raw = typeof errOrMessage === "string"
    ? errOrMessage
    : errorMessageOf(errOrMessage);
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const locale = resolveLocale(localeOrIsRTL);

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return translate(locale, "auth.errors.invalidCredentials");
  }
  if (lower.includes("email not confirmed")) {
    return translate(locale, "auth.errors.emailNotConfirmed");
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return translate(locale, "auth.errors.userAlreadyRegistered");
  }
  if (lower.includes("password should be at least")) {
    return translate(locale, "auth.errors.passwordMinLength", { min: MIN_PASSWORD_LENGTH });
  }
  if (lower.includes("new password should be different")) {
    return translate(locale, "auth.errors.passwordMustDiffer");
  }
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("for security purposes")
  ) {
    return translate(locale, "auth.errors.rateLimited");
  }
  if (lower.includes("unable to validate email") || lower.includes("invalid email")) {
    return translate(locale, "auth.errors.invalidEmail");
  }
  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return translate(locale, "auth.errors.signupsDisabled");
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return translate(locale, "auth.errors.networkError");
  }

  return locale === "he"
    ? translate("he", "auth.errors.genericError")
    : trimmed;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.02c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77z" />
  </svg>
);

// Brand overrides for the shadcn primitives on this page (docs/BRAND.md: Components).
const tabTriggerClass =
  "focus-ring -mb-px rounded-none border-b-2 border-transparent py-3 text-[15px] text-dust data-[state=active]:border-plasma data-[state=active]:bg-transparent data-[state=active]:text-star data-[state=active]:shadow-none";
const inputClass = "h-11 bg-space border-line text-star text-[16px] focus-visible:ring-blueshift";
const submitButtonClass = "focus-ring w-full h-11 text-[16px] font-medium hover:bg-plasma-hi";
const googleButtonClass =
  "focus-ring w-full h-11 text-[15px] border-line bg-transparent text-star hover:bg-transparent hover:text-star hover:border-blueshift";
const errorAlertClass = "mb-5 border-danger/30 bg-danger/10 text-danger";
const noticeAlertClass = "mb-5 border-blueshift/30 bg-blueshift/10 text-star";

type AuthShellProps = { dir: string; title: string; subtitle?: string; children: ReactNode };

/** A calm, focused panel on space with the brand mark above the title. */
function AuthShell({ dir, title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex items-center justify-center px-4 sm:px-6 py-16 md:py-24" dir={dir}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <BlackHoleMark className="h-12 w-12" />
          <h1 className="mt-6 text-[clamp(1.9rem,4vw,2.4rem)] font-light leading-[1.1] tracking-[-0.01em] text-star">{title}</h1>
          {subtitle && <p className="mt-3 text-[16px] leading-[1.6] text-dust">{subtitle}</p>}
        </div>
        <div className="mt-10 border border-line bg-space-raised/60 px-5 py-7 sm:px-8 sm:py-8">{children}</div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const { isAuthenticated, isLoadingAuth, isPasswordRecovery, signIn, signUp, signInWithGoogle, updatePassword } = useAuth();
  const { t, dir, locale } = useTranslation();

  // Only show the password change form after an actual PASSWORD_RECOVERY event.
  const isRecovery = Boolean(isPasswordRecovery);
  const isExpiredRecoveryLink = !isPasswordRecovery && !isAuthenticated && !isLoadingAuth && searchParams.get("mode") === "recovery";

  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState(() => {
    const raw = oauthErrorFromUrl();
    return raw ? localizeAuthError(raw, locale) : "";
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isAuthenticated && !isRecovery) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, isRecovery, navigate, redirectTo]);

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (err) {
      setError(localizeAuthError(err, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("auth.errors.passwordMinLength", { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    setIsSubmitting(true);
    try {
      const { session } = await signUp({ email, password, fullName });
      if (!session) {
        setMessage(t("auth.confirmEmailNotice"));
        setTab("signin");
      }
    } catch (err) {
      setError(localizeAuthError(err, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    resetFeedback();
    setIsSubmitting(true);
    try {
      // On success the browser leaves the page, so isSubmitting stays true until then.
      await signInWithGoogle(redirectTo);
    } catch (err) {
      setError(localizeAuthError(err, locale));
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (isSubmitting || isResettingPassword) return;
    resetFeedback();
    if (!email) {
      setError(t("auth.enterEmailForReset"));
      return;
    }
    setIsResettingPassword(true);
    try {
      await User.resetPassword(email);
      setMessage(t("auth.resetEmailSent"));
    } catch (err) {
      setError(localizeAuthError(err, locale));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleNewPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("auth.errors.passwordMinLength", { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(localizeAuthError(err, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRecovery || isExpiredRecoveryLink) {
    return (
      <AuthShell dir={dir} title={t("auth.chooseNewPasswordTitle")}>
        {error && (
          <Alert variant="destructive" className={errorAlertClass}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoadingAuth ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-dust" />
        ) : !isRecovery || !isAuthenticated ? (
          <p className="text-[15px] leading-[1.7] text-dust text-center">
            {t("auth.expiredRecoveryMessage")}
          </p>
        ) : (
          <form onSubmit={handleNewPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("auth.newPasswordLabel")}</Label>
              <Input id="new-password" type="password" dir="ltr" autoComplete="new-password" required
                className={inputClass} minLength={MIN_PASSWORD_LENGTH}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className={submitButtonClass} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("auth.savePasswordSubmit")}
            </Button>
          </form>
        )}
      </AuthShell>
    );
  }

  const isBusy = isSubmitting || isResettingPassword;

  return (
    <AuthShell dir={dir} title={t("auth.welcomeTitle")} subtitle={t("auth.welcomeSubtitle")}>
      <Tabs dir={dir} value={tab} onValueChange={(value) => { setTab(value); resetFeedback(); }}>
        <TabsList className="grid w-full grid-cols-2 h-auto mb-7 rounded-none bg-transparent p-0 border-b border-line">
          <TabsTrigger value="signin" className={tabTriggerClass}>{t("auth.signInTab")}</TabsTrigger>
          <TabsTrigger value="signup" className={tabTriggerClass}>{t("auth.signUpTab")}</TabsTrigger>
        </TabsList>

        {error && (
          <Alert variant="destructive" className={errorAlertClass}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className={noticeAlertClass}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button type="button" variant="outline" className={googleButtonClass} disabled={isBusy} onClick={handleGoogleSignIn}>
          <GoogleIcon />
          {tab === "signup" ? t("auth.signUpWithGoogle") : t("auth.signInWithGoogle")}
        </Button>
        <div className="flex items-center gap-3 my-6 text-[13px] text-dust">
          <div className="h-px flex-1 bg-line" />
          {t("auth.orWithEmail")}
          <div className="h-px flex-1 bg-line" />
        </div>

        <TabsContent value="signin" className="mt-0">
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signin-email">{t("auth.emailLabel")}</Label>
              <Input id="signin-email" type="email" dir="ltr" autoComplete="email" required className={inputClass}
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">{t("auth.passwordLabel")}</Label>
              <Input id="signin-password" type="password" dir="ltr" autoComplete="current-password" required className={inputClass}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className={submitButtonClass} disabled={isBusy}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("auth.signInSubmit")}
            </Button>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleResetPassword}
              className="focus-ring w-full rounded-md py-1 text-sm text-dust hover:text-blueshift underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isResettingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("auth.forgotPassword")}
            </button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="mt-0">
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signup-name">{t("auth.fullNameLabel")}</Label>
              <Input id="signup-name" autoComplete="name" className={inputClass}
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t("auth.emailLabel")}</Label>
              <Input id="signup-email" type="email" dir="ltr" autoComplete="email" required className={inputClass}
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">{t("auth.passwordLabel")}</Label>
              <Input id="signup-password" type="password" dir="ltr" autoComplete="new-password" required className={inputClass}
                minLength={MIN_PASSWORD_LENGTH}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className={submitButtonClass} disabled={isBusy}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("auth.createAccountSubmit")}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </AuthShell>
  );
}
