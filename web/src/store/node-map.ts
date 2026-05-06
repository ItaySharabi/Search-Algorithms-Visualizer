import type { SearchEvent, SerializedNode } from "@algo/api/search-event.js";

const map = new Map<number, SerializedNode>();

export function clearNodeMap(): void {
  map.clear();
}

export function ingestEvent(ev: SearchEvent): void {
  if (ev.type === "nodeGenerated") {
    map.set(ev.node.key, ev.node);
  } else if (ev.type === "searchStart") {
    const root: SerializedNode = {
      key: ev.rootKey,
      parentKey: null,
      depth: 0,
      weight: 0,
      state: ev.rootState,
    };
    map.set(ev.rootKey, root);
  }
}

export function getNode(key: number): SerializedNode | undefined {
  return map.get(key);
}

export function pathFromRoot(key: number): SerializedNode[] {
  const out: SerializedNode[] = [];
  let curr: SerializedNode | undefined = map.get(key);
  while (curr !== undefined) {
    out.push(curr);
    if (curr.parentKey === null) break;
    curr = map.get(curr.parentKey);
  }
  return out.reverse();
}
