import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSnapshot } from "@/hooks/useSnapshot";
import { getNode } from "@/store/node-map";
import { cn } from "@/lib/utils";

const COLOR_CLASSES: Record<string, string> = {
  R: "bg-red-500 text-white",
  G: "bg-emerald-500 text-white",
  B: "bg-blue-500 text-white",
  Y: "bg-yellow-400 text-black",
  _: "bg-muted text-muted-foreground/30",
};

export function BoardPanel(): JSX.Element {
  const snap = useSnapshot();
  const focusKey = snap.currentNodeKey ?? snap.lastGeneratedKey;
  const node = focusKey !== null ? getNode(focusKey) : undefined;
  const board = node?.state.board;
  const moved = node?.state.operatedMarblePos ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Board
          {node !== undefined && (
            <span className="ml-2 text-xs font-mono text-muted-foreground">
              #{node.key} · depth {node.depth} · g {node.weight}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {board === undefined ? (
          <div className="text-muted-foreground text-sm">Run an algorithm to see the board.</div>
        ) : (
          <div
            key={node?.key}
            className="grid gap-1 animate-fade-in"
            style={{ gridTemplateColumns: `repeat(${board.length}, minmax(0, 1fr))` }}
          >
            {board.map((row, i) =>
              row.map((cell, j) => {
                const isMoved = moved !== null && moved.i === i && moved.j === j;
                return (
                  <div
                    key={`${node?.key}-${i}-${j}`}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded font-bold text-sm select-none",
                      COLOR_CLASSES[cell] ?? "bg-muted",
                      isMoved && "animate-cell-pop ring-2 ring-ring",
                    )}
                  >
                    {cell === "_" ? "" : cell}
                  </div>
                );
              }),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
