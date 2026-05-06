import type { AlgoName, SearchEvent } from "@algo/api/search-event.js";

export type ToWorker =
  | { type: "run"; runId: string; algo: AlgoName; inputText: string; chunkSize?: number }
  | { type: "cancel"; runId: string };

export type FromWorker =
  | { type: "ready" }
  | { type: "started"; runId: string }
  | { type: "cancelled"; runId: string }
  | { type: "trace-chunk"; runId: string; events: SearchEvent[]; seq: number }
  | { type: "trace-complete"; runId: string; finalString: string; totalEvents: number }
  | { type: "error"; runId: string; message: string; stack?: string };
