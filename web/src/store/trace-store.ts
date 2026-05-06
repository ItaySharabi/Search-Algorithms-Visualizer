import { create } from "zustand";
import type { SearchEvent, AlgoName } from "@algo/api/search-event.js";
import { clearNodeMap, ingestEvent } from "./node-map";

export type RunStatus = "idle" | "running" | "complete" | "error" | "cancelled";

export interface RunMeta {
  runId: string;
  algoName: AlgoName | null;
  rootKey: number | null;
  status: RunStatus;
  finalString: string | null;
  error: string | null;
  totalEvents: number;
}

interface TraceStore {
  meta: RunMeta;
  events: SearchEvent[];
  currentStepIndex: number;

  reset(): void;
  startRun(runId: string): void;
  appendEvents(events: SearchEvent[]): void;
  finishRun(finalString: string, totalEvents: number): void;
  errorRun(message: string): void;
  cancelRun(): void;
  setStepIndex(i: number): void;
}

const initialMeta: RunMeta = {
  runId: "",
  algoName: null,
  rootKey: null,
  status: "idle",
  finalString: null,
  error: null,
  totalEvents: 0,
};

export const useTraceStore = create<TraceStore>((set, get) => ({
  meta: initialMeta,
  events: [],
  currentStepIndex: 0,

  reset() {
    clearNodeMap();
    set({ meta: initialMeta, events: [], currentStepIndex: 0 });
  },

  startRun(runId) {
    clearNodeMap();
    set({
      meta: { ...initialMeta, runId, status: "running" },
      events: [],
      currentStepIndex: 0,
    });
  },

  appendEvents(events) {
    let algoName = get().meta.algoName;
    let rootKey = get().meta.rootKey;
    for (const ev of events) {
      ingestEvent(ev);
      if (ev.type === "searchStart") {
        algoName = ev.algo;
        rootKey = ev.rootKey;
      }
    }
    set(s => ({
      events: s.events.concat(events),
      meta: { ...s.meta, algoName, rootKey },
    }));
  },

  finishRun(finalString, totalEvents) {
    set(s => ({
      meta: { ...s.meta, status: "complete", finalString, totalEvents },
    }));
  },

  errorRun(message) {
    set(s => ({ meta: { ...s.meta, status: "error", error: message } }));
  },

  cancelRun() {
    set(s => ({ meta: { ...s.meta, status: s.meta.status === "running" ? "cancelled" : s.meta.status } }));
  },

  setStepIndex(i) {
    const len = get().events.length;
    const clamped = Math.max(0, Math.min(i, len === 0 ? 0 : len - 1));
    set({ currentStepIndex: clamped });
  },
}));
