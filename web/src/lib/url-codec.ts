import type { AlgoName } from "@algo/api/search-event.js";

const ALGOS: readonly AlgoName[] = ["BFS", "DFID", "A*", "IDA*", "DFBnB"];

export interface UrlState {
  preset: string | null;
  algo: AlgoName | null;
  step: number | null;
}

export function encodeUrlState(s: UrlState): string {
  const parts: string[] = [];
  if (s.preset !== null) parts.push(`preset=${encodeURIComponent(s.preset)}`);
  if (s.algo !== null) parts.push(`algo=${encodeURIComponent(s.algo)}`);
  if (s.step !== null) parts.push(`step=${s.step}`);
  return parts.length === 0 ? "" : `#${parts.join("&")}`;
}

export function decodeUrlState(hash: string): UrlState {
  const out: UrlState = { preset: null, algo: null, step: null };
  const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
  if (cleaned === "") return out;
  for (const pair of cleaned.split("&")) {
    const [k, v] = pair.split("=");
    if (k === undefined || v === undefined) continue;
    const dec = decodeURIComponent(v);
    if (k === "preset") out.preset = dec;
    else if (k === "algo" && (ALGOS as readonly string[]).includes(dec)) out.algo = dec as AlgoName;
    else if (k === "step") {
      const n = parseInt(dec, 10);
      if (!Number.isNaN(n)) out.step = n;
    }
  }
  return out;
}
