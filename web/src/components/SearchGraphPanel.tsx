import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node as RFNode,
  type NodeProps,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import type { SerializedNode } from "@algo/api/search-event.js";
import { useTraceStore } from "@/store/trace-store";
import { useSnapshot } from "@/hooks/useSnapshot";
import { getAllNodes, getNode } from "@/store/node-map";

interface NodePayload {
  readonly key: number;
  readonly depth: number;
  readonly weight: number;
  readonly h: number | undefined;
  readonly f: number | undefined;
  readonly highlight: "default" | "frontier" | "explored" | "current" | "path" | "goal";
}

const NODE_WIDTH = 110;
const NODE_HEIGHT = 56;
const STREAM_REBUILD_THRESHOLD = 30;

function classFor(h: NodePayload["highlight"]): string {
  switch (h) {
    case "frontier":
      return "border-sky-400 bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100";
    case "explored":
      return "border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100";
    case "current":
      return "border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-400 dark:bg-amber-900/60 dark:text-amber-100";
    case "path":
      return "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
    case "goal":
      return "border-yellow-500 bg-yellow-200 text-yellow-900 ring-2 ring-yellow-500 dark:bg-yellow-700/70 dark:text-yellow-50";
    default:
      return "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
  }
}

function NodeCard({ data }: NodeProps<NodePayload>): JSX.Element {
  return (
    <div
      className={`rounded-md border px-2 py-1 text-[10px] font-mono shadow-sm ${classFor(data.highlight)}`}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center justify-between">
        <span className="font-semibold">#{data.key}</span>
        <span className="opacity-70">d{data.depth}</span>
      </div>
      <div className="opacity-80">
        g={data.weight}
        {data.h !== undefined ? ` h=${data.h}` : ""}
      </div>
      {data.f !== undefined && <div className="opacity-80">f={data.f}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

const nodeTypes = { search: NodeCard };

interface LaidOut {
  nodes: RFNode<NodePayload>[];
  edges: Edge[];
  totalCount: number;
}

function buildSolutionPath(goalKey: number | null): Set<number> {
  const out = new Set<number>();
  if (goalKey === null) return out;
  let curr: SerializedNode | undefined = getNode(goalKey);
  while (curr !== undefined) {
    out.add(curr.key);
    if (curr.parentKey === null) break;
    curr = getNode(curr.parentKey);
  }
  return out;
}

function layout(
  source: SerializedNode[],
  frontier: Set<number>,
  explored: Set<number>,
  currentKey: number | null,
  pathKeys: Set<number>,
  goalKey: number | null,
): LaidOut {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 24, ranksep: 48, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of source) {
    g.setNode(String(n.key), { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  const edges: Edge[] = [];
  for (const n of source) {
    if (n.parentKey !== null) {
      const id = `${n.parentKey}->${n.key}`;
      g.setEdge(String(n.parentKey), String(n.key));
      const onPath = pathKeys.has(n.key) && pathKeys.has(n.parentKey);
      edges.push({
        id,
        source: String(n.parentKey),
        target: String(n.key),
        type: "smoothstep",
        animated: onPath,
        style: onPath
          ? { stroke: "rgb(245 158 11)", strokeWidth: 2 }
          : { stroke: "rgb(148 163 184)", strokeWidth: 1 },
      });
    }
  }

  dagre.layout(g);

  const nodes: RFNode<NodePayload>[] = source.map(n => {
    const pos = g.node(String(n.key));
    let highlight: NodePayload["highlight"] = "default";
    if (n.key === goalKey) highlight = "goal";
    else if (n.key === currentKey) highlight = "current";
    else if (pathKeys.has(n.key)) highlight = "path";
    else if (frontier.has(n.key)) highlight = "frontier";
    else if (explored.has(n.key)) highlight = "explored";

    return {
      id: String(n.key),
      type: "search",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        key: n.key,
        depth: n.depth,
        weight: n.weight,
        h: n.h,
        f: n.f,
        highlight,
      },
      draggable: false,
    };
  });

  return { nodes, edges, totalCount: source.length };
}

export function SearchGraphPanel(): JSX.Element {
  const events = useTraceStore(s => s.events);
  const meta = useTraceStore(s => s.meta);
  const setStepIndex = useTraceStore(s => s.setStepIndex);
  const snap = useSnapshot();

  const [laid, setLaid] = useState<LaidOut>({ nodes: [], edges: [], totalCount: 0 });
  const lastBuiltAtRef = useRef<number>(0);

  const goalKey: number | null = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i]!;
      if (ev.type === "searchEnd") {
        return ev.success ? ev.goalNodeKey : null;
      }
    }
    return null;
  }, [events.length, meta.status]);

  const frontierSet = useMemo(() => new Set(snap.frontierKeys), [snap.frontierKeys]);
  const exploredSet = snap.exploredKeys;
  const currentKey = snap.currentNodeKey ?? snap.lastGeneratedKey;
  const pathKeys = useMemo(() => buildSolutionPath(goalKey), [goalKey, meta.status]);

  // Streamed rebuild: re-layout on chunky deltas during a run, and on completion.
  useEffect(() => {
    const len = events.length;
    const isTerminal = meta.status !== "running";
    if (!isTerminal && len - lastBuiltAtRef.current < STREAM_REBUILD_THRESHOLD && len !== 0) return;
    lastBuiltAtRef.current = len;
    const all = getAllNodes();
    setLaid(layout(all, frontierSet, exploredSet, currentKey, pathKeys, goalKey));
  }, [events.length, meta.status, frontierSet, exploredSet, currentKey, pathKeys, goalKey]);

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: RFNode<NodePayload>) => {
      const targetKey = node.data.key;
      let popIdx = -1;
      let genIdx = -1;
      for (let i = 0; i < events.length; i++) {
        const ev = events[i]!;
        if (ev.type === "nodePoppedFromFrontier" && ev.nodeKey === targetKey) popIdx = i;
        else if (ev.type === "nodeGenerated" && ev.node.key === targetKey && genIdx === -1) genIdx = i;
      }
      const idx = popIdx >= 0 ? popIdx : genIdx;
      if (idx >= 0) setStepIndex(idx);
    },
    [events, setStepIndex],
  );

  const empty = laid.nodes.length === 0;

  return (
    <div className="relative h-[calc(100vh-12rem)] w-full rounded-md border bg-background">
      {empty ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Run a search to see the expansion graph.
        </div>
      ) : (
        <ReactFlow
          nodes={laid.nodes}
          edges={laid.edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.05}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
        >
          <Background gap={24} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="!bg-muted/40" />
        </ReactFlow>
      )}
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-1 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm">
        <div className="font-semibold">Legend</div>
        <Legend swatch="bg-sky-300 border-sky-500" label="frontier" />
        <Legend swatch="bg-emerald-300 border-emerald-500" label="explored" />
        <Legend swatch="bg-amber-300 border-amber-500" label="current" />
        <Legend swatch="bg-yellow-400 border-yellow-600" label="goal" />
        <Legend swatch="bg-amber-200 border-amber-400" label="solution path" />
        <div className="mt-1 text-muted-foreground">
          Nodes: {laid.totalCount} · Status: {meta.status}
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded border ${swatch}`} />
      <span>{label}</span>
    </div>
  );
}
