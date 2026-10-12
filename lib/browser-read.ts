// One bounded read at a time. Superseded/unmounted reads cannot publish results,
// even if a transport ignores AbortSignal and completes later.
export class BrowserRead {
  private active?: { controller: AbortController; promise: Promise<void> };
  constructor(private readonly timeoutMs = 10000) {}

  cancel() {
    const active = this.active;
    this.active = undefined;
    active?.controller.abort();
  }

  run<T>(read: (signal: AbortSignal) => Promise<T>, apply: (value: T) => void, fail: (error: unknown) => void): Promise<void> {
    if (this.active) return this.active.promise;
    const controller = new AbortController();
    const active = { controller, promise: Promise.resolve() };
    this.active = active;
    active.promise = (async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let onAbort: (() => void) | undefined;
      try {
        const deadline = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error('Connection timed out. Try again.'));
            controller.abort();
          }, this.timeoutMs);
        });
        const cancelled = new Promise<never>((_, reject) => {
          onAbort = () => reject(controller.signal.reason);
          controller.signal.addEventListener('abort', onAbort, { once: true });
        });
        const value = await Promise.race([Promise.resolve().then(() => {
          controller.signal.throwIfAborted();
          return read(controller.signal);
        }), deadline, cancelled]);
        if (this.active === active) apply(value);
      } catch (error) {
        if (this.active === active) fail(error);
      } finally {
        clearTimeout(timer);
        if (onAbort) controller.signal.removeEventListener('abort', onAbort);
        if (this.active === active) this.active = undefined;
      }
    })();
    return active.promise;
  }
}
