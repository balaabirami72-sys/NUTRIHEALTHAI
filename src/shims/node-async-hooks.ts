export class AsyncLocalStorage {
  disable() {}
  getStore() {
    return undefined;
  }
  run<T>(store: unknown, callback: (...args: unknown[]) => T, ...args: unknown[]): T {
    return callback(...args);
  }
}

export default AsyncLocalStorage;
