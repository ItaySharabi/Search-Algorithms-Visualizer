import { useMemo } from "react";
import { useTraceStore } from "@/store/trace-store";
import { buildSnapshotAt, type SearchSnapshot } from "@/store/snapshot";

export function useSnapshot(): SearchSnapshot {
  const events = useTraceStore(s => s.events);
  const stepIndex = useTraceStore(s => s.currentStepIndex);
  return useMemo(() => buildSnapshotAt(events, stepIndex), [events, stepIndex]);
}
