// UP, DOWN, RIGHT, LEFT — iteration order is significant for reproducibility.
export const Direction = {
  UP: "UP",
  DOWN: "DOWN",
  RIGHT: "RIGHT",
  LEFT: "LEFT",
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

export const DIRECTION_VALUES: readonly Direction[] = [
  Direction.UP,
  Direction.DOWN,
  Direction.RIGHT,
  Direction.LEFT,
] as const;

export function directionValues(): readonly Direction[] {
  return DIRECTION_VALUES;
}
