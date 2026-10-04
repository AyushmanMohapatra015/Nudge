import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RequestWindow, boundedRequestText, RequestGuardError } from '../lib/request-guards';

test('bounded rate windows reject excess work and reopen at the boundary', () => {
  const window = new RequestWindow(2, 60000);
  assert.equal(window.take(1000), 0); assert.equal(window.take(1001), 0);
  assert.equal(window.take(1002), 60);
  assert.equal(window.take(60999), 1); assert.equal(window.take(61000), 0);
  const epoch = new RequestWindow(1);
  assert.equal(epoch.take(0), 0); assert.equal(epoch.take(1), 60);
});

test('body guards count streamed UTF-8 bytes even without or with misleading content length', async () => {
  assert.equal(await boundedRequestText(new Request('http://localhost', { method: 'POST', body: 'é' }), 2), 'é');
  await assert.rejects(boundedRequestText(new Request('http://localhost', { method: 'POST', body: 'é' }), 1), e => e instanceof RequestGuardError && e.status === 413);
  await assert.rejects(boundedRequestText(new Request('http://localhost', { method: 'POST', headers: { 'content-length': '1' }, body: 'oversized' }), 2), e => e instanceof RequestGuardError && e.status === 413);
  await assert.rejects(boundedRequestText(new Request('http://localhost', { method: 'POST', headers: { 'content-length': '100' }, body: 'ok' }), 2), e => e instanceof RequestGuardError && e.status === 413);
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array([0xc3])); controller.enqueue(new Uint8Array([0xa9])); controller.close(); } });
  assert.equal(await boundedRequestText(new Request('http://localhost', { method: 'POST', body: stream, duplex: 'half' } as RequestInit), 2), 'é');
});

test('a stalled request body times out and cancels the stream', async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const request = new Request('http://localhost', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
  await assert.rejects(boundedRequestText(request, 100, 15), e => e instanceof RequestGuardError && e.status === 408);
  assert.equal(cancelled, true);
});
