import type { SearchEvent } from "@algo/api/search-event.js";

export interface SearchSnapshot {
  eventIndex: number;
  frontierKeys: number[];
  exploredKeys: Set<number>;
  currentNodeKey: number | null;
  lastGeneratedKey: number | null;
  stats: {
    numGenerated: number;
    numExpanded: number;
    numPruned: number;
    frontierSize: number;
    exploredSize: number;
    iterationIndex: number | null;
    threshold: number | null;
    upperBound: number | null;
    bestCost: number | null;
    pathString: string | null;
    elapsedMs: number | null;
  };
}

export function emptySnapshot(): SearchSnapshot {
  return {
    eventIndex: -1,
    frontierKeys: [],
    exploredKeys: new Set(),
    currentNodeKey: null,
    lastGeneratedKey: null,
    stats: {
      numGenerated: 0,
      numExpanded: 0,
      numPruned: 0,
      frontierSize: 0,
      exploredSize: 0,
      iterationIndex: null,
      threshold: null,
      upperBound: null,
      bestCost: null,
      pathString: null,
      elapsedMs: null,
    },
  };
}

export function applyEvent(snap: SearchSnapshot, ev: SearchEvent, eventIndex: number): SearchSnapshot {
  // Mutate-in-place for perf — this function is called O(events) times during replay.
  snap.eventIndex = eventIndex;

  switch (ev.type) {
    case "searchStart": {
      snap.frontierKeys = [ev.rootKey];
      snap.exploredKeys = new Set();
      snap.currentNodeKey = null;
      snap.lastGeneratedKey = ev.rootKey;
      snap.stats = {
        ...snap.stats,
        numGenerated: 1,
        numExpanded: 0,
        numPruned: 0,
        frontierSize: 1,
        exploredSize: 0,
        threshold: ev.threshold ?? null,
        upperBound: ev.upperBound ?? null,
      };
      break;
    }
    case "searchEnd": {
      snap.stats = {
        ...snap.stats,
        pathString: ev.pathString,
        bestCost: ev.success ? ev.cost : null,
        elapsedMs: ev.elapsedMs,
      };
      break;
    }
    case "iterationStart": {
      snap.stats = {
        ...snap.stats,
        iterationIndex: ev.index,
        threshold: ev.threshold ?? snap.stats.threshold,
      };
      break;
    }
    case "iterationEnd":
      break;
    case "cutoffRaised": {
      snap.stats = { ...snap.stats, threshold: ev.newThreshold };
      break;
    }
    case "nodeGenerated": {
      snap.lastGeneratedKey = ev.node.key;
      snap.stats = {
        ...snap.stats,
        numGenerated: snap.stats.numGenerated + 1,
      };
      break;
    }
    case "nodePushedToFrontier": {
      snap.frontierKeys = [...snap.frontierKeys, ev.nodeKey];
      snap.stats = { ...snap.stats, frontierSize: snap.frontierKeys.length };
      break;
    }
    case "nodePoppedFromFrontier": {
      snap.frontierKeys = snap.frontierKeys.filter(k => k !== ev.nodeKey);
      snap.currentNodeKey = ev.nodeKey;
      snap.stats = {
        ...snap.stats,
        frontierSize: snap.frontierKeys.length,
        numExpanded: snap.stats.numExpanded + 1,
      };
      break;
    }
    case "nodeRemovedFromFrontier": {
      snap.frontierKeys = snap.frontierKeys.filter(k => k !== ev.nodeKey);
      snap.stats = { ...snap.stats, frontierSize: snap.frontierKeys.length };
      break;
    }
    case "nodeAddedToExplored": {
      const next = new Set(snap.exploredKeys);
      next.add(ev.nodeKey);
      snap.exploredKeys = next;
      snap.stats = { ...snap.stats, exploredSize: next.size };
      break;
    }
    case "nodeFrontierImproved":
      break;
    case "nodeMarkedForPostprocessing":
      break;
    case "nodePruned": {
      snap.stats = { ...snap.stats, numPruned: snap.stats.numPruned + 1 };
      break;
    }
    case "successorsOrdered":
      break;
    case "goalFound":
      break;
    case "bestPathUpdated": {
      snap.stats = { ...snap.stats, bestCost: ev.cost, upperBound: ev.cost };
      break;
    }
  }
  return snap;
}

export function buildSnapshotAt(events: SearchEvent[], targetIndex: number): SearchSnapshot {
  const snap = emptySnapshot();
  const limit = Math.min(targetIndex + 1, events.length);
  for (let i = 0; i < limit; i++) {
    applyEvent(snap, events[i]!, i);
  }
  return snap;
}
