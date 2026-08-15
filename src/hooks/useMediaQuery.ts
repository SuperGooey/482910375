import { useCallback, useSyncExternalStore } from "react";

function getServerSnapshot() {
  return false;
}

// subscribes to a CSS media query via matchMedia rather than polling resize
// events — useSyncExternalStore is the correct primitive for subscribing to
// this kind of external, synchronously-readable browser state.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
