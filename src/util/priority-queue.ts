export class PriorityQueue<T> {
  private readonly heap: T[] = [];
  private readonly compare: (a: T, b: T) => number;

  get size(): number {
    return this.heap.length;
  }

  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  push(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0] as T;
    const last = this.heap.pop() as T;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  peek(): T | undefined {
    return this.heap.length > 0 ? (this.heap[0] as T) : undefined;
  }

  /**
   * Remove by reference equality (===). Linear scan + sift to restore heap
   * order. O(n).
   */
  remove(item: T): boolean {
    const idx = this.heap.indexOf(item);
    if (idx === -1) return false;

    const last = this.heap.pop() as T;
    if (idx === this.heap.length) {
      // item was the last element; already removed by pop
      return true;
    }
    this.heap[idx] = last;
    // Restore heap: try sift up first, then sift down if nothing moved
    const moved = this.siftUp(idx);
    if (!moved) {
      this.siftDown(idx);
    }
    return true;
  }

  private siftUp(i: number): boolean {
    let moved = false;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      const parentItem = this.heap[parent] as T;
      const currentItem = this.heap[i] as T;
      if (this.compare(currentItem, parentItem) < 0) {
        this.heap[parent] = currentItem;
        this.heap[i] = parentItem;
        i = parent;
        moved = true;
      } else {
        break;
      }
    }
    return moved;
  }

  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.compare(this.heap[left] as T, this.heap[smallest] as T) < 0) {
        smallest = left;
      }
      if (right < n && this.compare(this.heap[right] as T, this.heap[smallest] as T) < 0) {
        smallest = right;
      }
      if (smallest === i) break;
      const tmp = this.heap[i] as T;
      this.heap[i] = this.heap[smallest] as T;
      this.heap[smallest] = tmp;
      i = smallest;
    }
  }
}
