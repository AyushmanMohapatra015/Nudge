import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { reviewBrowserArtifacts } from '../scripts/browser-artifact-review.mjs';

test('browser artifact review detects synthetic secret bytes and source maps without printing values', () => {
  const directory = resolve('data/artifact-review-tests', randomUUID());
  mkdirSync(directory, { recursive: true });
  const marker = 'fictional-review-' + randomUUID();
  writeFileSync(resolve(directory, 'clean.js'), 'const publicLabel="Nudge";');
  assert.equal(reviewBrowserArtifacts(directory, { ownerToken: marker }).success, true);
  writeFileSync(resolve(directory, 'unexpected.js'), 'const unexpected=' + JSON.stringify(marker));
  writeFileSync(resolve(directory, 'unexpected.js.map'), '{}');
  const report = reviewBrowserArtifacts(directory, { ownerToken: marker });
  assert.deepEqual(report.findings, [{ file: 'unexpected.js', category: 'ownerToken' }]);
  assert.deepEqual(report.sourceMaps, ['unexpected.js.map']);
  assert.equal(report.success, false);
  assert.equal(JSON.stringify(report).includes(marker), false);
  assert.throws(() => reviewBrowserArtifacts(directory, { key: '' }), /markers/);
});
