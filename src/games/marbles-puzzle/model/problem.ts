import type {
  IProblem,
  IPathFormatter,
  HeuristicEval,
  SerializedNode,
  SerializedState,
  SearchEventEmitter,
} from "../../../api/index.js";
import { Node } from "../../../api/index.js";
import { BFS } from "../../../algorithms/index.js";
import { DFID } from "../../../algorithms/index.js";
import { AStar } from "../../../algorithms/index.js";
import { IDAStar } from "../../../algorithms/index.js";
import { DFBnB } from "../../../algorithms/index.js";
import { State } from "./state.js";
import { Operator } from "./operator.js";
import { Marble } from "./marble.js";
import { MarblesPathFormatter } from "./marbles-path-formatter.js";
import { ManhattanDistance } from "../heuristics/manhattan-distance.js";
import { toSerializedNode, toSerializedState } from "../serialize.js";

export class Problem implements IProblem<State, Operator> {
  private readonly start: State;
  private readonly goal: State;
  private readonly formatter: IPathFormatter<State> = new MarblesPathFormatter();

  constructor(start: State, goal: State) {
    this.start = start;
    this.goal = goal;
  }

  getInitialState(): State {
    return this.start;
  }

  getGoalState(): State {
    return this.goal;
  }

  getPathFormatter(): IPathFormatter<State> {
    return this.formatter;
  }

  expand(n: Node<State>): Operator[] {
    return Operator.allowedOperators(n);
  }

  serializeState(s: State): SerializedState {
    return toSerializedState(s);
  }

  serializeNode(n: Node<State>, h?: HeuristicEval<State>): SerializedNode {
    return toSerializedNode(n, h);
  }

  solve(algoName: string, verbose: boolean, events?: SearchEventEmitter): string {
    State.reset();
    Node.reset();
    Marble.reset();

    const heuristic = new ManhattanDistance(this.goal);
    const name = algoName.toUpperCase();

    let algo:
      | BFS<State, Operator>
      | DFID<State, Operator>
      | AStar<State, Operator>
      | IDAStar<State, Operator>
      | DFBnB<State, Operator>;

    if (name === "BFS") {
      algo = new BFS(this, verbose, events);
    } else if (name === "DFID") {
      algo = new DFID(this, verbose, events);
    } else if (name === "A*" || name === "ASTAR") {
      algo = new AStar(this, heuristic, verbose, events);
    } else if (name === "IDA*" || name === "IDASTAR") {
      algo = new IDAStar(this, heuristic, verbose, events);
    } else if (name === "DFBNB") {
      algo = new DFBnB(this, heuristic, verbose, events);
    } else {
      throw new Error(`Invalid algorithm name: ${algoName}`);
    }

    return algo.execute();
  }

  toString(): string {
    return (
      "\n`Arrange The Marbles`:\n" +
      "Let's try to find a solution for this game!\n" +
      "===========================================\n\n\n" +
      "Initial board state:\n" +
      this.start +
      "\nGoal board state:\n" +
      this.goal
    );
  }
}
