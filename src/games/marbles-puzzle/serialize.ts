import type {
  SerializedNode,
  SerializedState,
  SerializedDirection,
} from "../../api/search-event.js";
import type { HeuristicEval } from "../../api/heuristic-eval.js";
import type { Node } from "../../api/node.js";
import type { State } from "./model/state.js";

export function toSerializedState(state: State): SerializedState {
  const op = state.operatedMarble;
  const dir = state.operatedMarbleDirection;
  return {
    key: state.key(),
    board: state.getBoard(),
    cost: state.getCost(),
    operatedMarbleTag: op?.tag ?? null,
    operatedMarbleDirection: (dir as SerializedDirection | null) ?? null,
    operatedMarblePos: op !== null ? { i: op.i, j: op.j } : null,
  };
}

export function toSerializedNode(
  node: Node<State>,
  heuristic?: HeuristicEval<State>,
): SerializedNode {
  if (heuristic !== undefined) {
    return {
      key: node.key,
      parentKey: node.parent?.key ?? null,
      depth: node.depth,
      weight: node.weight,
      state: toSerializedState(node.state),
      h: heuristic.h(node.state),
      f: heuristic.f(node),
    };
  }
  return {
    key: node.key,
    parentKey: node.parent?.key ?? null,
    depth: node.depth,
    weight: node.weight,
    state: toSerializedState(node.state),
  };
}
