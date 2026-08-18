import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/nutrition";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = new Set(["/auth"]);

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [profile] = useProfile();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
      setStatus(data.session ? "in" : "out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setStatus(session ? "in" : "out");
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "out" && !PUBLIC_PATHS.has(pathname)) {
      navigate({ to: "/auth" });
    } else if (status === "in" && pathname === "/auth") {
      navigate({ to: profile.complete ? "/" : "/onboarding" });
    } else if (status === "in" && !profile.complete && pathname !== "/onboarding") {
      navigate({ to: "/onboarding" });
    }
  }, [status, pathname, navigate, profile.complete]);

  // Sync user id into localStorage for downstream tables (meals namespaced).
  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      window.localStorage.setItem("nutri-health-ai.userId", userId);
    }
  }, [userId]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (status === "out" && !PUBLIC_PATHS.has(pathname)) return null;
  if (status === "in" && !profile.complete && pathname !== "/onboarding") return null;
  return <>{children}</>;
}