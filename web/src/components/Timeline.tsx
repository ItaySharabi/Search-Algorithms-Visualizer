import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTraceStore } from "@/store/trace-store";
import { usePlayback, SPEEDS, type PlaybackSpeed } from "@/hooks/usePlayback";

export function Timeline(): JSX.Element {
  const stepIndex = useTraceStore(s => s.currentStepIndex);
  const eventsLen = useTraceStore(s => s.events.length);
  const setStepIndex = useTraceStore(s => s.setStepIndex);
  const pb = usePlayback();
  const max = Math.max(0, eventsLen - 1);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={pb.jumpToStart} disabled={eventsLen === 0}>⏮</Button>
          <Button size="sm" variant="outline" onClick={() => pb.step(-1)} disabled={stepIndex === 0}>◀</Button>
          <Button size="sm" onClick={pb.toggle} disabled={eventsLen === 0}>
            {pb.isPlaying ? "⏸ Pause" : "▶ Play"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => pb.step(1)} disabled={stepIndex >= max}>▶</Button>
          <Button size="sm" variant="outline" onClick={pb.jumpToEnd} disabled={eventsLen === 0}>⏭</Button>
          <div className="ml-4 flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">speed</span>
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => pb.setSpeed(s as PlaybackSpeed)}
                className={
                  "rounded px-2 py-1 font-mono " +
                  (pb.speed === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
                }
              >
                {s}×
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs font-mono text-muted-foreground">
            {stepIndex + 1} / {eventsLen}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={max}
          value={stepIndex}
          onChange={e => setStepIndex(parseInt(e.target.value, 10))}
          className="w-full"
          disabled={eventsLen === 0}
        />
      </CardContent>
    </Card>
  );
}
