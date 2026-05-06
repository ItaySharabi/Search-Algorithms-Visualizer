import { useCallback, useEffect, useRef, useState } from "react";
import type { AlgoName, SearchEvent } from "@algo/api/search-event.js";
import type { FromWorker, ToWorker } from "@/types/messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Row {
  algo: AlgoName;
  status: "idle" | "running" | "complete" | "error";
  numGenerated: number;
  cost: number | null;
  elapsedMs: number | null;
  error: string | null;
}

const ALGOS: readonly AlgoName[] = ["BFS", "DFID", "A*", "IDA*", "DFBnB"];
const initialRows = (): Row[] =>
  ALGOS.map(a => ({
    algo: a,
    status: "idle",
    numGenerated: 0,
    cost: null,
    elapsedMs: null,
    error: null,
  }));

interface Props {
  inputText: string;
}

export function ComparisonTable({ inputText }: Props): JSX.Element {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [running, setRunning] = useState(false);
  const workersRef = useRef<Worker[]>([]);

  const cleanup = useCallback(() => {
    for (const w of workersRef.current) w.terminate();
    workersRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const runAll = useCallback(() => {
    cleanup();
    setRows(initialRows().map(r => ({ ...r, status: "running" })));
    setRunning(true);
    let outstanding = ALGOS.length;

    ALGOS.forEach((algo, idx) => {
      const runId = `cmp-${Date.now()}-${idx}`;
      const w = new Worker(
        new URL("../worker/search.worker.ts", import.meta.url),
        { type: "module" },
      );
      workersRef.current.push(w);

      let nodeCount = 0;
      w.addEventListener("message", (e: MessageEvent<FromWorker>) => {
        const msg = e.data;
        if (msg.type === "trace-chunk" && msg.runId === runId) {
          for (const ev of msg.events as SearchEvent[]) {
            if (ev.type === "nodeGenerated") nodeCount++;
          }
          setRows(rs => rs.map(r => (r.algo === algo ? { ...r, numGenerated: nodeCount } : r)));
        } else if (msg.type === "trace-complete" && msg.runId === runId) {
          // The finalString carries `Num: N\nCost: C\ntime: T` lines.
          const numMatch = msg.finalString.match(/Num:\s+(\d+)/);
          const costMatch = msg.finalString.match(/Cost:\s+([\d.]+|inf)/);
          const timeMatch = msg.finalString.match(/time:\s+([\d.]+)/);
          setRows(rs =>
            rs.map(r =>
              r.algo === algo
                ? {
                    ...r,
                    status: "complete",
                    numGenerated: numMatch !== null ? parseInt(numMatch[1]!, 10) : r.numGenerated,
                    cost:
                      costMatch !== null && costMatch[1] !== "inf"
                        ? parseFloat(costMatch[1]!)
                        : null,
                    elapsedMs: timeMatch !== null ? Math.round(parseFloat(timeMatch[1]!) * 1000) : null,
                  }
                : r,
            ),
          );
          outstanding--;
          if (outstanding === 0) setRunning(false);
        } else if (msg.type === "error" && msg.runId === runId) {
          setRows(rs => rs.map(r => (r.algo === algo ? { ...r, status: "error", error: msg.message } : r)));
          outstanding--;
          if (outstanding === 0) setRunning(false);
        }
      });

      const send: ToWorker = { type: "run", runId, algo, inputText };
      w.postMessage(send);
    });
  }, [inputText, cleanup]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Algorithm comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Runs all five algorithms on the current preset/paste in parallel workers and tabulates
          their results.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={runAll} disabled={running}>
            {running ? "Running…" : "Run all"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              cleanup();
              setRows(initialRows());
              setRunning(false);
            }}
            disabled={running}
          >
            Reset
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-1 pr-3">Algo</th>
                <th className="py-1 pr-3">Status</th>
                <th className="py-1 pr-3">Generated</th>
                <th className="py-1 pr-3">Cost</th>
                <th className="py-1 pr-3">Time (ms)</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map(r => (
                <tr key={r.algo} className="border-b">
                  <td className="py-1 pr-3">{r.algo}</td>
                  <td className="py-1 pr-3">
                    {r.status === "complete"
                      ? "✓"
                      : r.status === "error"
                        ? <span className="text-destructive" title={r.error ?? ""}>✗</span>
                        : r.status === "running"
                          ? "…"
                          : "—"}
                  </td>
                  <td className="py-1 pr-3">{r.numGenerated || "—"}</td>
                  <td className="py-1 pr-3">{r.cost ?? "—"}</td>
                  <td className="py-1 pr-3">{r.elapsedMs ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
