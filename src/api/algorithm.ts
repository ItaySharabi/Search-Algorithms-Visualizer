import type { IState } from "./i-state.js";
import type { IOperator } from "./i-operator.js";
import type { IPathFormatter } from "./i-path-formatter.js";
import type { IProblem } from "./i-problem.js";
import { Node } from "./node.js";
import {
  NULL_EMITTER,
  type AlgoName,
  type SearchEvent,
  type SearchEventEmitter,
  type SerializedState,
} from "./search-event.js";

export abstract class Algorithm<S extends IState, O extends IOperator<S>> {
  protected name = "~Algorithm~";
  protected readonly start: S;
  protected readonly goal: S;
  protected readonly formatter: IPathFormatter<S>;
  protected readonly verbose: boolean;
  protected readonly events: SearchEventEmitter;

  constructor(
    protected readonly problem: IProblem<S, O>,
    verbose: boolean,
    events: SearchEventEmitter = NULL_EMITTER,
  ) {
    this.verbose = verbose;
    this.events = events;
    this.start = problem.getInitialState();
    this.goal = problem.getGoalState();
    this.formatter = problem.getPathFormatter();
  }

  abstract execute(): string;

  protected isGoal(x: S | Node<S>): boolean {
    const state = x instanceof Node ? x.state : x;
    return state.equals(this.goal);
  }

  protected path(n: Node<S> | null): string {
    return this.formatter.formatPath(n);
  }

  protected emit(event: SearchEvent): void {
    this.events.emit(event);
  }

  protected emitSearchStart(
    algo: AlgoName,
    rootKey: number,
    rootState: SerializedState,
    extras: { threshold?: number; upperBound?: number } = {},
  ): void {
    const event: SearchEvent =
      extras.threshold !== undefined && extras.upperBound !== undefined
        ? { type: "searchStart", algo, rootKey, rootState, threshold: extras.threshold, upperBound: extras.upperBound }
        : extras.threshold !== undefined
          ? { type: "searchStart", algo, rootKey, rootState, threshold: extras.threshold }
          : extras.upperBound !== undefined
            ? { type: "searchStart", algo, rootKey, rootState, upperBound: extras.upperBound }
            : { type: "searchStart", algo, rootKey, rootState };
    this.events.emit(event);
  }

  protected output(
    path: string,
    cost: number,
    startMs: number,
    goalNodeKey: number | null,
  ): string {
    const elapsedMs = Date.now() - startMs;
    const elapsed = elapsedMs / 1000;
    const numGenerated = this.formatter.boardCount();
    const success = !!path && path !== "no path";

    let result: string;
    if (!success) {
      result =
        "Path: Path could not be found!" +
        "\nNum: " + numGenerated +
        "\nCost: inf" +
        "\ntime: " + elapsed;
    } else {
      if (this.verbose) {
        console.log("Goal State found:\n" + this.goal);
      }
      result =
        path +
        "\nNum: " + numGenerated +
        "\nCost: " + cost +
        "\ntime: " + elapsed;
    }

    this.events.emit({
      type: "searchEnd",
      success,
      goalNodeKey,
      cost: success ? cost : Number.POSITIVE_INFINITY,
      numGenerated,
      elapsedMs,
      pathString: result,
    });

    return result;
  }

  protected print(n: Node<S>): void {
    if (this.verbose) {
      console.log(n.toString());
    }
  }
}
