import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSnapshot } from "@/hooks/useSnapshot";
import { useTraceStore } from "@/store/trace-store";

function StatRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function StatsPanel(): JSX.Element {
  const snap = useSnapshot();
  const meta = useTraceStore(s => s.meta);
  const eventsLen = useTraceStore(s => s.events.length);
  const stepIndex = useTraceStore(s => s.currentStepIndex);
  const s = snap.stats;

  return (
    <Card>
      <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
      <CardContent className="space-y-1.5">
        <StatRow label="Algorithm" value={meta.algoName ?? "—"} />
        <StatRow label="Status" value={meta.status} />
        <StatRow label="Step" value={`${stepIndex + 1} / ${eventsLen}`} />
        <StatRow label="Generated" value={s.numGenerated} />
        <StatRow label="Expanded" value={s.numExpanded} />
        <StatRow label="Pruned" value={s.numPruned} />
        <StatRow label="Frontier" value={s.frontierSize} />
        <StatRow label="Explored" value={s.exploredSize} />
        {s.iterationIndex !== null && <StatRow label="Iteration" value={s.iterationIndex} />}
        {s.threshold !== null && <StatRow label="Threshold" value={s.threshold} />}
        {s.upperBound !== null && s.upperBound !== Number.MAX_SAFE_INTEGER && (
          <StatRow label="Upper bound" value={s.upperBound} />
        )}
        {s.bestCost !== null && <StatRow label="Best cost" value={s.bestCost} />}
        {s.elapsedMs !== null && <StatRow label="Elapsed" value={`${s.elapsedMs} ms`} />}
      </CardContent>
    </Card>
  );
}
