/// <reference lib="webworker" />
import type { ToWorker, FromWorker } from "@/types/messages";
import { parseInputText } from "./parse-input";
import { WorkerEmitter } from "./emitter";

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

function post(msg: FromWorker): void {
  ctx.postMessage(msg);
}

ctx.addEventListener("message", (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  if (msg.type !== "run") return;

  const { runId, algo, inputText, chunkSize = 5000 } = msg;
  post({ type: "started", runId });

  let emitter: WorkerEmitter | null = null;
  try {
    const { problem } = parseInputText(inputText);
    emitter = new WorkerEmitter(runId, chunkSize, post);
    const finalString = problem.solve(algo, false, emitter);
    emitter.flush();
    post({
      type: "trace-complete",
      runId,
      finalString,
      totalEvents: emitter.getTotal(),
    });
  } catch (err: unknown) {
    if (emitter) emitter.flush();
    const e = err as Error;
    post({
      type: "error",
      runId,
      message: e.message ?? String(err),
      ...(e.stack !== undefined ? { stack: e.stack } : {}),
    });
  }
});

post({ type: "ready" });
