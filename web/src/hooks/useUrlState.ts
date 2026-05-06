import { useEffect } from "react";
import type { AlgoName } from "@algo/api/search-event.js";
import { encodeUrlState, decodeUrlState, type UrlState } from "@/lib/url-codec";

export function readInitialUrlState(): UrlState {
  if (typeof window === "undefined") {
    return { preset: null, algo: null, step: null };
  }
  return decodeUrlState(window.location.hash);
}

interface SyncArgs {
  preset: string;
  algo: AlgoName;
  step: number | null;
}

export function useUrlState({ preset, algo, step }: SyncArgs): void {
  useEffect(() => {
    const hash = encodeUrlState({ preset, algo, step });
    if (window.location.hash !== hash) {
      const url = new URL(window.location.href);
      url.hash = hash;
      window.history.replaceState(null, "", url.toString());
    }
  }, [preset, algo, step]);
}
