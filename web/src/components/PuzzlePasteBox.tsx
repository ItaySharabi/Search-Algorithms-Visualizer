import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  onUse: (text: string) => void;
}

const SAMPLE = `BFS
no
small
R,R,_
B,B,_
G,G,_
Goal state:
R,R,B
B,G,_
G,_,_`;

export function PuzzlePasteBox({ onUse }: Props): JSX.Element {
  const [text, setText] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom puzzle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Paste a puzzle in the same format the CLI accepts. First line: algorithm name (ignored —
          chosen via the picker). Second: <code>with open</code> or anything else. Third:{" "}
          <code>big</code> (5×5) or anything else (3×3). Then the initial board, a separator line,
          then the goal board.
        </p>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setErr(null); }}
          placeholder={SAMPLE}
          className="w-full h-40 font-mono text-xs rounded-md border border-input bg-background p-2"
        />
        {err !== null && <div className="text-xs text-destructive">{err}</div>}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (text.trim() === "") {
                setErr("Empty input.");
                return;
              }
              onUse(text);
            }}
          >
            Use this puzzle
          </Button>
          <Button size="sm" variant="outline" onClick={() => setText(SAMPLE)}>
            Load sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
