import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSnapshot } from "@/hooks/useSnapshot";
import { useTraceStore } from "@/store/trace-store";
import { useMemo } from "react";

export function ExploredPanel(): JSX.Element {
  const snap = useSnapshot();
  const events = useTraceStore(s => s.events);
  const stepIndex = useTraceStore(s => s.currentStepIndex);

  // Recently-explored: last few nodeAddedToExplored events at or before currentStepIndex.
  const recent = useMemo(() => {
    const out: number[] = [];
    for (let i = stepIndex; i >= 0 && out.length < 10; i--) {
      const ev = events[i];
      if (ev?.type === "nodeAddedToExplored") out.push(ev.nodeKey);
    }
    return out;
  }, [events, stepIndex]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Explored
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {snap.exploredKeys.size} {snap.exploredKeys.size === 1 ? "node" : "nodes"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            None yet. (DFID / IDA* / DFBnB don't track an explored set.)
          </div>
        ) : (
          <div className="space-y-1 text-xs font-mono">
            <div className="text-muted-foreground">recently explored:</div>
            <div className="flex flex-wrap gap-1">
              {recent.map(k => (
                <span key={k} className="rounded bg-muted px-2 py-0.5">#{k}</span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
