import type { SearchEvent, SearchEventEmitter } from "@algo/api/search-event.js";
import type { FromWorker } from "@/types/messages";

const TRACE_CAP = 5_000_000;

export class WorkerEmitter implements SearchEventEmitter {
  private readonly buffer: SearchEvent[] = [];
  private seq = 0;
  private total = 0;
  private truncated = false;

  constructor(
    private readonly runId: string,
    private readonly chunkSize: number,
    private readonly post: (msg: FromWorker) => void,
  ) {}

  emit(event: SearchEvent): void {
    if (this.total >= TRACE_CAP) {
      this.truncated = true;
      return;
    }
    this.buffer.push(event);
    this.total++;
    if (this.buffer.length >= this.chunkSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    const events = this.buffer.splice(0, this.buffer.length);
    this.post({ type: "trace-chunk", runId: this.runId, events, seq: this.seq++ });
  }

  getTotal(): number {
    return this.total;
  }

  wasTruncated(): boolean {
    return this.truncated;
  }
}
