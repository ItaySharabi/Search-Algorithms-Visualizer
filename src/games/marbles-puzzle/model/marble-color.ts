export const EMPTY = "_" as const;
export const EMPTY_COST = 0 as const;

const COLOR_MAP: ReadonlyMap<string, number> = new Map([
  ["R", 1],
  ["G", 10],
  ["B", 2],
  ["Y", 1],
]);

export function costOf(tag: string): number {
  if (tag === EMPTY) return EMPTY_COST;
  const cost = COLOR_MAP.get(tag);
  if (cost === undefined) {
    throw new Error(`Unknown marble tag: ${tag}`);
  }
  return cost;
}

export function isColor(tag: string | null | undefined): boolean {
  if (tag == null) return false;
  return COLOR_MAP.has(tag);
}
