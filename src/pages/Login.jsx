import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAppData } from "@/components/hooks/useAppData";
import { User } from "@/entities/User";

const MIN_PASSWORD_LENGTH = 6;

// Only allow same-origin relative redirects.
const safeRedirect = (value) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/");

// OAuth failures come back as error_description in the query string or the hash.
const oauthErrorFromUrl = () => {
  if (typeof window === "undefined") return "";
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.get("error_description") || queryParams.get("error_description") || "";
};

/**
 * Translates raw Supabase Auth error messages into localized user-facing strings.
 */
export function localizeAuthError(errOrMessage, isRTL = true) {
  const raw = typeof errOrMessage === "string"
    ? errOrMessage
    : errOrMessage?.message || "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  const t = (he, en) => (isRTL ? he : en);

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return t("אימייל או סיסמה שגויים", "Invalid email or password");
  }
  if (lower.includes("email not confirmed")) {
    return t("האימייל טרם אומת. בדוק את תיבת הדואר הנכנס שלך.", "Email not confirmed. Please check your inbox.");
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return t("משתמש עם כתובת אימייל זו כבר רשום במערכת", "A user with this email is already registered");
  }
  if (lower.includes("password should be at least")) {
    return t(`הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (lower.includes("new password should be different")) {
    return t("הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית", "New password must be different from the current password");
  }
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("for security purposes")
  ) {
    return t("בוצעו יותר מדי ניסיונות. אנא המתן מעט ונסה שוב.", "Too many attempts. Please wait a moment and try again.");
  }
  if (lower.includes("unable to validate email") || lower.includes("invalid email")) {
    return t("כתובת האימייל אינה תקינה", "Please enter a valid email address");
  }
  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return t("ההרשמה למערכת מושבתת כעת", "Sign-ups are currently disabled");
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return t("שגיאת תקשורת עם השרת. בדוק את החיבור לאינטרנט ונסה שוב.", "Network error. Please check your internet connection and try again.");
  }

  return isRTL ? "אירעה שגיאה בתהליך האימות. אנא נסה שוב." : trimmed;
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
  const { isRTL } = useAppData();

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
    return raw ? localizeAuthError(raw, isRTL) : "";
  });
  const [message, setMessage] = useState("");

  const t = (he, en) => (isRTL ? he : en);

  useEffect(() => {
    if (isAuthenticated && !isRecovery) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, isRecovery, navigate, redirectTo]);

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    resetFeedback();
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (err) {
      setError(localizeAuthError(err, isRTL));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    resetFeedback();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t(`הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`));
      return;
    }
    setIsSubmitting(true);
    try {
      const { session } = await signUp({ email, password, fullName });
      if (!session) {
        setMessage(t("נשלח אליך אימייל לאימות החשבון. לאחר האימות ניתן להתחבר.", "Check your inbox to confirm your account, then sign in."));
        setTab("signin");
      }
    } catch (err) {
      setError(localizeAuthError(err, isRTL));
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
      setError(localizeAuthError(err, isRTL));
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (isSubmitting || isResettingPassword) return;
    resetFeedback();
    if (!email) {
      setError(t("הזן אימייל כדי לאפס סיסמה", "Enter your email to reset your password"));
      return;
    }
    setIsResettingPassword(true);
    try {
      await User.resetPassword(email);
      setMessage(t("נשלח אימייל לאיפוס סיסמה", "Password reset email sent"));
    } catch (err) {
      setError(localizeAuthError(err, isRTL));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleNewPassword = async (event) => {
    event.preventDefault();
    resetFeedback();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t(`הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`));
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(localizeAuthError(err, isRTL));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRecovery || isExpiredRecoveryLink) {
    return (
      <div className="flex items-center justify-center px-4 py-16" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("בחירת סיסמה חדשה", "Choose a new password")}</CardTitle>
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
                {t("הקישור לאיפוס אינו תקף או שפג תוקפו. בקשו קישור חדש ממסך ההתחברות.", "This reset link is invalid or has expired. Request a new one from the sign-in page.")}
              </p>
            ) : (
              <form onSubmit={handleNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t("סיסמה חדשה", "New password")}</Label>
                  <Input id="new-password" type="password" dir="ltr" autoComplete="new-password" required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("שמור סיסמה", "Save password")}
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
    <div className="flex items-center justify-center px-4 py-16" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("ברוכים הבאים ל-Experimenta", "Welcome to Experimenta")}</CardTitle>
          <CardDescription>
            {t("התחברו כדי לשמור ריצות ולצפות בתוצאות", "Sign in to save runs and view your results")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => { setTab(value); resetFeedback(); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">{t("התחברות", "Sign in")}</TabsTrigger>
              <TabsTrigger value="signup">{t("הרשמה", "Sign up")}</TabsTrigger>
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
              {tab === "signup" ? t("הרשמה עם Google", "Sign up with Google") : t("התחברות עם Google", "Sign in with Google")}
            </Button>
            <div className="flex items-center gap-3 my-5 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              {t("או עם אימייל", "or with email")}
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t("אימייל", "Email")}</Label>
                  <Input id="signin-email" type="email" dir="ltr" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t("סיסמה", "Password")}</Label>
                  <Input id="signin-password" type="password" dir="ltr" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isBusy}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("התחבר", "Sign in")}
                </Button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleResetPassword}
                  className="w-full text-sm text-slate-500 hover:text-slate-800 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResettingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {t("שכחתי סיסמה", "Forgot password?")}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t("שם מלא", "Full name")}</Label>
                  <Input id="signup-name" autoComplete="name"
                    value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("אימייל", "Email")}</Label>
                  <Input id="signup-email" type="email" dir="ltr" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("סיסמה", "Password")}</Label>
                  <Input id="signup-password" type="password" dir="ltr" autoComplete="new-password" required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isBusy}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("צור חשבון", "Create account")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
