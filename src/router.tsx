import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Minimal path-based router.
 *
 * The publication is a single-page app served behind an Express/Vercel layer
 * that already renders the right document head for each URL, so we only need
 * to own client-side navigation, scroll restoration and query-string reads.
 */

interface RouterState {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterState | null>(null);

function readPath(): string {
  const redirect = new URLSearchParams(window.location.search).get("redirect_to");
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    window.history.replaceState(null, "", redirect);
  }
  return window.location.pathname || "/";
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<string>(() => readPath());

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    const hashIndex = to.indexOf("#");
    const rawPath = hashIndex === -1 ? to : to.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : to.slice(hashIndex + 1);
    const target = rawPath === "" ? "/" : rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    const safeTarget = target.startsWith("//") ? "/" : target;

    if (window.location.pathname !== safeTarget) {
      window.history.pushState(null, "", `${safeTarget}${hash ? `#${hash}` : ""}`);
      setPath(window.location.pathname || "/");
    } else if (hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${hash}`);
    }

    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  const value = { path, navigate };
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterState {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useRouter must be used inside <RouterProvider>");
  return context;
}

export function useNavigate(): RouterState["navigate"] {
  return useRouter().navigate;
}

export function usePath(): string {
  return useRouter().path;
}
