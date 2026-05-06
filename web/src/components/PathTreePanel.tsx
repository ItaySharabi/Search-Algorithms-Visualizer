import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSnapshot } from "@/hooks/useSnapshot";
import { getNode, pathFromRoot } from "@/store/node-map";

function edgeLabel(node: { state: { operatedMarbleTag: string | null; operatedMarblePos: { i: number; j: number } | null; operatedMarbleDirection: string | null } }): string | null {
  const t = node.state.operatedMarbleTag;
  const dst = node.state.operatedMarblePos;
  const dir = node.state.operatedMarbleDirection;
  if (t === null || dst === null || dir === null) return null;
  let si = dst.i, sj = dst.j;
  switch (dir) {
    case "UP":    si = dst.i + 1; break;
    case "DOWN":  si = dst.i - 1; break;
    case "LEFT":  sj = dst.j + 1; break;
    case "RIGHT": sj = dst.j - 1; break;
  }
  return `(${si + 1},${sj + 1}):${t}:(${dst.i + 1},${dst.j + 1})`;
}

export function PathTreePanel(): JSX.Element {
  const snap = useSnapshot();
  const focusKey = snap.currentNodeKey ?? snap.lastGeneratedKey;
  const path = focusKey !== null ? pathFromRoot(focusKey) : [];
  const focused = focusKey !== null ? getNode(focusKey) : undefined;

  return (
    <Card>
      <CardHeader><CardTitle>Path from root</CardTitle></CardHeader>
      <CardContent>
        {path.length === 0 ? (
          <div className="text-muted-foreground text-sm">No path yet.</div>
        ) : (
          <div className="flex flex-col gap-1 text-xs font-mono max-h-64 overflow-y-auto">
            {path.map((n, i) => {
              const lbl = edgeLabel(n);
              const isFocused = focused !== undefined && focused.key === n.key;
              return (
                <div key={n.key} className={isFocused ? "rounded bg-accent px-2 py-1" : "px-2 py-1"}>
                  <span className="text-muted-foreground">d{n.depth}</span>{" "}
                  <span>#{n.key}</span>{" "}
                  <span className="text-muted-foreground">g={n.weight}</span>
                  {lbl !== null && i > 0 && (
                    <div className="text-muted-foreground pl-6">↳ {lbl}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
