import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { checkPublicSource } from '../scripts/check-public-source.mjs';

test('working-tree deletions are explicit and do not hide indexed credential paths', () => {
  mkdirSync('data', { recursive: true });
  const root = mkdtempSync(resolve('data/public-source-deletion-'));
  const hooks = join(root, 'empty-hooks'); mkdirSync(hooks);
  const git = (args: string[]) => execFileSync('git', ['-C', root, '-c', `core.hooksPath=${hooks}`, ...args], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  git(['init', '--quiet']);
  writeFileSync(join(root, 'README.md'), 'Fictional retained setup.\n');
  writeFileSync(join(root, 'internal-packet.md'), 'Fictional historical review.\n');
  git(['add', '--', 'README.md', 'internal-packet.md']);
  git(['-c', 'user.name=Fictional Reviewer', '-c', 'user.email=fictional@users.noreply.github.com', '-c', 'commit.gpgSign=false', 'commit', '-qm', 'Fictional review fixture']);
  unlinkSync(join(root, 'internal-packet.md'));
  let report = checkPublicSource(root);
  assert.deepEqual(report.pendingDeletedPaths, ['internal-packet.md']);
  assert.equal(report.reviewedFiles, 1);
  assert.deepEqual(report.findings, []);
  assert.equal(report.historyContentScanned, false);
  assert.match(git(['show', 'HEAD:internal-packet.md']), /historical review/);
  // Even a deleted indexed credential file must still block a clean source report.
  writeFileSync(join(root, '.env.local'), 'FICTIONAL_ONLY=fixture\n');
  git(['add', '--', '.env.local']);
  unlinkSync(join(root, '.env.local'));
  report = checkPublicSource(root);
  assert.ok(report.findings.some(f => f.path === '.env.local' && f.category === 'tracked-sensitive-file'));
});
