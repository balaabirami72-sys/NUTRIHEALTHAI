import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Nutri Health AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          navigate({ to: "/" });
        }
      } catch (error) {
        console.error("auth session check failed", error);
      }
    };

    run();
  }, [navigate]);

  const onGoogle = async () => {
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast.error("Google sign-in failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const onEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);

    try {
      const formData = new FormData(e.currentTarget);

      const nextEmail = String(formData.get("email") || "").trim();
      const nextPassword = String(formData.get("password") || "");

      if (!nextEmail || !nextPassword) {
        throw new Error("Please enter both email and password.");
      }

      setEmail(nextEmail);
      setPassword(nextPassword);

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: nextEmail,
          password: nextPassword,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? window.location.origin
                : undefined,
          },
        });

        if (error) throw error;

        if (data.session) {
          navigate({ to: "/" });
        } else {
          toast.success("Account created", {
            description:
              "Check your inbox and verify your email before signing in.",
          });
        }
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: nextEmail,
            password: nextPassword,
          });

        if (error) throw error;

        if (data.session) {
          navigate({ to: "/" });
        }
      }
    } catch (err) {
      toast.error(
        mode === "signup" ? "Sign up failed" : "Sign in failed",
        {
          description:
            err instanceof Error ? err.message : "Try again.",
        }
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <Card className="relative w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Leaf className="h-6 w-6" />
          </div>

          <CardTitle className="text-2xl">
            Welcome to Nutri Health AI
          </CardTitle>

          <CardDescription>
            AI mineral & macro tracking, personalised to your body.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={onGoogle}
            disabled={busy}
            variant="outline"
            className="w-full"
          >
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="relative my-2 flex items-center text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span className="px-3">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void onEmail(e);
            }}
            className="space-y-3"
          >
            {/* EMAIL */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>

              <Input
                id="pw"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <button
            onClick={() =>
              setMode((m) =>
                m === "signin" ? "signup" : "signin"
              )
            }
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-1.9 1.3-4.3 2.1-7 2.1-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.7 5l6 5.1c-.4.4 6.4-4.7 6.4-14.1 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}