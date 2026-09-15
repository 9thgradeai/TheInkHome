import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [prefers, setPrefers] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setPrefers(m.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);
  return prefers;
}
