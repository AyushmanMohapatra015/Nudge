export class RequestGuardError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

// One counter per route class: bounded memory, no IP/header/token retention.
// Process-local only; deployment needs a trusted edge or shared limiter.
export class RequestWindow {
  private startedAt: number | undefined;
  private used = 0;
  constructor(private readonly limit: number, private readonly intervalMs = 60000) {}
  take(now = Date.now()) {
    if (this.startedAt === undefined || now >= this.startedAt + this.intervalMs || now < this.startedAt) { this.startedAt = now; this.used = 0; }
    if (this.used >= this.limit) return Math.max(1, Math.ceil((this.startedAt + this.intervalMs - now) / 1000));
    this.used++;
    return 0;
  }
}

export const clientReadWindow = new RequestWindow(600);
export const clientDecisionWindow = new RequestWindow(60);
export const webhookWindow = new RequestWindow(120);
export const ownerLoginWindow = new RequestWindow(10);

export async function boundedRequestText(request: Request, maxBytes: number, timeoutMs = 10000) {
  const declared = request.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) throw new RequestGuardError('Request body is too large.', 413);
  if (!request.body) return '';
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { reject(new RequestGuardError('Request body timed out.', 408)); void reader.cancel().catch(() => {}); }, timeoutMs); });
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0, text = '';
    for (;;) {
      const part = await Promise.race([reader.read(), timeout]);
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) { void reader.cancel().catch(() => {}); throw new RequestGuardError('Request body is too large.', 413); }
      text += decoder.decode(part.value, { stream: true });
    }
    return text + decoder.decode();
  } finally { if (timer) clearTimeout(timer); reader.releaseLock(); }
}
