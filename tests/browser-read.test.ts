import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BrowserRead } from '../lib/browser-read';

test('hung read times out even if transport ignores abort; retry succeeds and late data is ignored', async () => {
  const reader = new BrowserRead(20), values: string[] = [], failures: unknown[] = [];
  let finish!: (value: string) => void;
  let signal!: AbortSignal;
  await reader.run(s => { signal = s; return new Promise<string>(resolve => { finish = resolve; }); }, value => values.push(value), e => failures.push(e));
  assert.equal(signal.aborted, true);
  assert.match(String(failures[0]), /Connection timed out/);
  await reader.run(async () => 'fresh', value => values.push(value), e => failures.push(e));
  finish('late'); await Promise.resolve();
  assert.deepEqual(values, ['fresh']); assert.equal(failures.length, 1);
});

test('simultaneous refreshes share one read and one publication', async () => {
  const reader = new BrowserRead(), values: number[] = [];
  let count = 0, finish!: (value: number) => void;
  const operation = () => { count++; return new Promise<number>(resolve => { finish = resolve; }); };
  const first = reader.run(operation, value => values.push(value), () => assert.fail());
  const second = reader.run(operation, value => values.push(value), () => assert.fail());
  assert.equal(first, second); await Promise.resolve(); finish(7); await first;
  assert.equal(count, 1); assert.deepEqual(values, [7]);
});

test('cancelled read settles promptly and cannot overwrite a new read or publish a stale error', async () => {
  const reader = new BrowserRead(), values: string[] = [];
  let failOld!: (error: Error) => void;
  const old = reader.run(() => new Promise<string>((_, reject) => { failOld = reject; }), v => values.push(v), () => assert.fail('Stale error'));
  await Promise.resolve(); reader.cancel(); await old;
  await reader.run(async () => 'new', v => values.push(v), () => assert.fail());
  failOld(new Error('stale')); await Promise.resolve();
  assert.deepEqual(values, ['new']);
});
