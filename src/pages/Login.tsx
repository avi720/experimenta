import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation, translate, resolveLocale, type LocaleInput } from "@/i18n";
import { User } from "@/entities/User";

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
      <div className="flex items-center justify-center px-4 py-16" dir={dir}>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.chooseNewPasswordTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {isLoadingAuth ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
            ) : !isRecovery || !isAuthenticated ? (
              <p className="text-sm text-slate-600 text-center">
                {t("auth.expiredRecoveryMessage")}
              </p>
            ) : (
              <form onSubmit={handleNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t("auth.newPasswordLabel")}</Label>
                  <Input id="new-password" type="password" dir="ltr" autoComplete="new-password" required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("auth.savePasswordSubmit")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isBusy = isSubmitting || isResettingPassword;

  return (
    <div className="flex items-center justify-center px-4 py-16" dir={dir}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.welcomeTitle")}</CardTitle>
          <CardDescription>
            {t("auth.welcomeSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => { setTab(value); resetFeedback(); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">{t("auth.signInTab")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUpTab")}</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert className="mb-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="button" variant="outline" className="w-full" disabled={isBusy} onClick={handleGoogleSignIn}>
              <GoogleIcon />
              {tab === "signup" ? t("auth.signUpWithGoogle") : t("auth.signInWithGoogle")}
            </Button>
            <div className="flex items-center gap-3 my-5 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              {t("auth.orWithEmail")}
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t("auth.emailLabel")}</Label>
                  <Input id="signin-email" type="email" dir="ltr" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t("auth.passwordLabel")}</Label>
                  <Input id="signin-password" type="password" dir="ltr" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isBusy}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("auth.signInSubmit")}
                </Button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleResetPassword}
                  className="w-full text-sm text-slate-500 hover:text-slate-800 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResettingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {t("auth.forgotPassword")}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t("auth.fullNameLabel")}</Label>
                  <Input id="signup-name" autoComplete="name"
                    value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("auth.emailLabel")}</Label>
                  <Input id="signup-email" type="email" dir="ltr" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("auth.passwordLabel")}</Label>
                  <Input id="signup-password" type="password" dir="ltr" autoComplete="new-password" required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isBusy}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("auth.createAccountSubmit")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
