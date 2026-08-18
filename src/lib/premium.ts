import { useEffect, useState } from "react";

const KEY = "nutri-health-ai.premium";

export function usePremium(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setOn(window.localStorage.getItem(KEY) === "1");
    const h = () => setOn(window.localStorage.getItem(KEY) === "1");
    window.addEventListener("nutri-health-ai:premium", h);
    return () => window.removeEventListener("nutri-health-ai:premium", h);
  }, []);
  const set = (v: boolean) => {
    window.localStorage.setItem(KEY, v ? "1" : "0");
    window.dispatchEvent(new CustomEvent("nutri-health-ai:premium"));
    setOn(v);
  };
  return [on, set];
}