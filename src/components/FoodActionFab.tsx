import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Camera, ImagePlus, Type, Plus, X } from "lucide-react";

const ACTIONS = [
  { mode: "text",   label: "Describe in text",   icon: Type,       desc: "“2 eggs and avocado toast”" },
  { mode: "upload", label: "Upload a photo",     icon: ImagePlus,  desc: "From your gallery" },
  { mode: "camera", label: "Take a picture",     icon: Camera,     desc: "Live camera capture" },
] as const;

export function FoodActionFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (pathname === "/auth" || pathname === "/onboarding") return null;

  const go = (mode: string) => {
    setOpen(false);
    navigate({ to: "/scanner", search: { mode } as never });
  };

  return (
    <>
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm" />}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col items-end gap-2">
            {ACTIONS.map((a, i) => (
              <button
                key={a.mode}
                onClick={() => go(a.mode)}
                style={{ animation: `liquid-shift 4s ease-in-out infinite`, animationDelay: `${i * 80}ms` }}
                className="group flex items-center gap-3 rounded-full border border-border/60 bg-card/95 py-2.5 pl-4 pr-3 text-sm shadow-xl backdrop-blur transition hover:border-primary/60 hover:bg-card hover:shadow-[var(--shadow-glow)]"
              >
                <div className="text-right">
                  <div className="font-medium">{a.label}</div>
                  <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground">
                  <a.icon className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Quick log a meal"
          className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105 ${open ? "rotate-45" : ""}`}
        >
          <span className="absolute inset-0 rounded-full glow-border" />
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}