import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSnapshot } from "@/hooks/useSnapshot";
import { getNode } from "@/store/node-map";
import { useTraceStore } from "@/store/trace-store";
import { useMemo } from "react";

export function FrontierPanel(): JSX.Element {
  const snap = useSnapshot();
  const events = useTraceStore(s => s.events);
  const stepIndex = useTraceStore(s => s.currentStepIndex);

  // Look ahead for the next pop — that's the heap top.
  const nextPopKey = useMemo(() => {
    for (let i = stepIndex + 1; i < events.length; i++) {
      const ev = events[i]!;
      if (ev.type === "nodePoppedFromFrontier") return ev.nodeKey;
    }
    return null;
  }, [events, stepIndex]);

  const algoName = useTraceStore(s => s.meta.algoName);
  const isDFID = algoName === "DFID";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Frontier
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {snap.frontierKeys.length} {snap.frontierKeys.length === 1 ? "node" : "nodes"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isDFID ? (
          <div className="text-muted-foreground text-xs">
            DFID's frontier is the recursion stack — see the Path from root panel.
          </div>
        ) : snap.frontierKeys.length === 0 ? (
          <div className="text-muted-foreground text-sm">Empty.</div>
        ) : (
          <div className="space-y-1 text-xs font-mono max-h-64 overflow-y-auto">
            {snap.frontierKeys.slice(0, 100).map(k => {
              const node = getNode(k);
              const isTop = k === nextPopKey;
              return (
                <div
                  key={k}
                  className={isTop ? "rounded bg-primary text-primary-foreground px-2 py-1" : "px-2 py-1"}
                >
                  #{k}{" "}
                  <span className={isTop ? "" : "text-muted-foreground"}>
                    g={node?.weight ?? "?"}
                    {node?.f !== undefined && <> · f={node.f}</>}
                    {node?.h !== undefined && <> · h={node.h}</>}
                  </span>
                </div>
              );
            })}
            {snap.frontierKeys.length > 100 && (
              <div className="text-muted-foreground text-xs italic">
                … {snap.frontierKeys.length - 100} more
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
