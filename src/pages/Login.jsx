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

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const { isAuthenticated, isLoadingAuth, isPasswordRecovery, signIn, signUp, updatePassword } = useAuth();
  const isRecovery = isPasswordRecovery || searchParams.get("mode") === "recovery";
  const { isRTL } = useAppData();

  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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
      setError(err.message === "Invalid login credentials"
        ? t("אימייל או סיסמה שגויים", "Invalid email or password")
        : err.message);
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
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    resetFeedback();
    if (!email) {
      setError(t("הזן אימייל כדי לאפס סיסמה", "Enter your email to reset your password"));
      return;
    }
    try {
      await User.resetPassword(email);
      setMessage(t("נשלח אימייל לאיפוס סיסמה", "Password reset email sent"));
    } catch (err) {
      setError(err.message);
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
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRecovery) {
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
            ) : !isAuthenticated ? (
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("התחבר", "Sign in")}
                </Button>
                <button type="button" onClick={handleResetPassword}
                  className="w-full text-sm text-slate-500 hover:text-slate-800 underline-offset-4 hover:underline">
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
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
