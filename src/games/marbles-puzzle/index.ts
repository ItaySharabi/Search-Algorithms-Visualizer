export { Problem } from "./model/problem.js";
export { State } from "./model/state.js";
export { Operator } from "./model/operator.js";
export { Marble } from "./model/marble.js";
export { MarblesPathFormatter } from "./model/marbles-path-formatter.js";
export { ManhattanDistance } from "./heuristics/manhattan-distance.js";
export { MisplacedMarbles } from "./heuristics/misplaced-marbles.js";
export { IOHandler } from "./model/utils/io-handler.js";

import { IOHandler } from "./model/utils/io-handler.js";
import type { Problem } from "./model/problem.js";

export interface LoadedMarblesProblem {
  problem: Problem;
  algoName: string;
  verbose: boolean;
  io: IOHandler;
}

export async function loadMarblesProblem(path: string): Promise<LoadedMarblesProblem> {
  const io = await IOHandler.load(path);
  return {
    problem: io.getProblem(),
    algoName: io.getAlgorithmName(),
    verbose: io.getVerbose(),
    io,
  };
}
