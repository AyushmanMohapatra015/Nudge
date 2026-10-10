import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metadataFindings, decodeBlobBatch, historyFinding } from '../scripts/check-public-history.mjs';

test('history metadata report suppresses identity values and preserves both author and committer findings', () => {
  const commit = 'a'.repeat(40), email = 'fictional-private@example.com';
  const token = ['gh', 'p_', 'b'.repeat(30)].join('');
  const findings = metadataFindings(commit, email, email, 'Example message\n' + token);
  assert.equal(findings.length, 3);
  assert.deepEqual(findings.slice(0, 2).map((f: { role?: string }) => f.role), ['author', 'committer']);
  assert.equal(JSON.stringify(findings).includes(email), false);
  assert.equal(JSON.stringify(findings).includes(token), false);
  assert.deepEqual(metadataFindings(commit, '123+fictional@users.noreply.github.com', 'noreply@github.com', 'Normal message'), []);
  assert.equal(metadataFindings(commit, 'fake@users.noreply.github.com.attacker.example', '', '').length, 1);
});

test('history batch reader respects byte lengths, Unicode and framing rather than interpreting content as object headers', () => {
  const id = 'a'.repeat(40), text = 'Fictional हिन्दी\n' + id + ' blob 4\n';
  const size = Buffer.byteLength(text);
  const framed = Buffer.concat([Buffer.from(`${id} blob ${size}\n`), Buffer.from(text), Buffer.from('\n')]);
  assert.deepEqual(decodeBlobBatch(framed, [{ id, size }]), [{ id, text }]);
  assert.throws(() => decodeBlobBatch(framed, [{ id: 'b'.repeat(40), size }]), /envelope/);
  assert.throws(() => decodeBlobBatch(framed.subarray(0, framed.length - 1), [{ id, size }]), /envelope/);
  assert.throws(() => decodeBlobBatch(Buffer.concat([framed, Buffer.from('extra')]), [{ id, size }]), /trailing/);
});

test('history placeholder triage is narrow and leaves actual-looking endpoints or other paths pending', () => {
  const host = ['https://YOUR-HOST', '.trycloudflare.com'].join('');
  const finding = { path: 'README.md', category: 'temporary-public-tunnel', line: 1 };
  assert.equal(historyFinding('README.md', host, finding, 'a'.repeat(40)).review, 'known-documentation-placeholder');
  const unknown = ['https://fictional-session', '.trycloudflare.com'].join('');
  assert.equal(historyFinding('README.md', host + ' ' + unknown, finding, 'a'.repeat(40)).review, 'needs-private-review');
  assert.equal(historyFinding('other.md', host, finding, 'a'.repeat(40)).review, 'needs-private-review');
});
