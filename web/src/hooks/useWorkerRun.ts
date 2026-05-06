import { useCallback, useEffect, useRef } from "react";
import type { AlgoName } from "@algo/api/search-event.js";
import type { FromWorker, ToWorker } from "@/types/messages";
import { useTraceStore } from "@/store/trace-store";

export function useWorkerRun() {
  const workerRef = useRef<Worker | null>(null);
  const startRun = useTraceStore(s => s.startRun);
  const appendEvents = useTraceStore(s => s.appendEvents);
  const finishRun = useTraceStore(s => s.finishRun);
  const errorRun = useTraceStore(s => s.errorRun);

  const cancel = useCallback(() => {
    if (workerRef.current !== null) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    useTraceStore.getState().cancelRun();
  }, []);

  const ensureFreshWorker = useCallback((): Worker => {
    if (workerRef.current !== null) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    const w = new Worker(
      new URL("../worker/search.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = w;
    return w;
  }, []);

  const run = useCallback(
    (algo: AlgoName, inputText: string) => {
      const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      startRun(runId);
      const worker = ensureFreshWorker();

      worker.addEventListener("message", (e: MessageEvent<FromWorker>) => {
        const msg = e.data;
        if (msg.type === "trace-chunk" && msg.runId === runId) {
          appendEvents(msg.events);
        } else if (msg.type === "trace-complete" && msg.runId === runId) {
          finishRun(msg.finalString, msg.totalEvents);
        } else if (msg.type === "error" && msg.runId === runId) {
          errorRun(msg.message);
        }
      });

      const send: ToWorker = { type: "run", runId, algo, inputText };
      worker.postMessage(send);
    },
    [startRun, appendEvents, finishRun, errorRun, ensureFreshWorker],
  );

  useEffect(() => () => cancel(), [cancel]);

  return { run, cancel };
}
