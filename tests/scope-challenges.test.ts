import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { scopeChallenges, scoreScopeChallenge } from '../evaluation/scope-challenges';
import { scopeAgreement } from '../evaluation/scope-cases';

test('mixed and ambiguous challenge fixtures have valid evidence and scorer never establishes semantic safety', () => {
  assert.equal(scopeChallenges.length, 6); assert.equal(new Set(scopeChallenges.map(c => c.id)).size, 6);
  for (const fixture of scopeChallenges) {
    assert.ok(fixture.references.every(id => scopeAgreement.clauses.some(c => c.id === id)));
    const output = { classification: fixture.expected, summary: 'Fictional output for testing the harness and scorer only.', references: fixture.references, questions: fixture.needsQuestion ? [fixture.mockQuestion!] : [], deliverables: [fixture.mockDeliverable], source: 'elastic' };
    assert.equal(scoreScopeChallenge(fixture.id, output).automatedChecksPassed, true);
    assert.equal(scoreScopeChallenge(fixture.id, { ...output, references: ['S99'] }).automatedChecksPassed, false);
    assert.equal(scoreScopeChallenge(fixture.id, { ...output, classification: fixture.expected === 'additional' ? 'included' : 'additional' }).automatedChecksPassed, false);
    assert.equal(scoreScopeChallenge(fixture.id, { ...output, questions: fixture.needsQuestion ? [] : ['What is your budget?'] }).automatedChecksPassed, false);
  }
  const dangerous = scoreScopeChallenge('mixed-checkout', { classification: 'additional', summary: 'Checkout is excluded and the first revision is included.', references: ['S3', 'S5'], questions: [], deliverables: ['Checkout and the included heading colour change for USD 900'], source: 'elastic' });
  assert.equal(dangerous.automatedChecksPassed, true);
  assert.equal(dangerous.manualReviewRequired, true); assert.equal(dangerous.modelRunVerified, false);
  assert.throws(() => scoreScopeChallenge('unknown', {}), /Unknown/);
});

function run(args: string[]) {
  const env = { ...process.env, NUDGE_AI_ENABLED: 'false', NUDGE_AI_PROVIDER: 'elastic' };
  return spawnSync(process.execPath, ['--import', 'tsx', 'scripts/run-scope-challenges.ts', ...args], { env, encoding: 'utf8', timeout: 20000 });
}
function record(stdout: string) {
  const line = stdout.trim().split('\n').findLast(l => l.startsWith('{'));
  assert.ok(line); const result = JSON.parse(line);
  assert.ok(result.artifactDirectory.startsWith(resolve('data/scope-challenges') + sep));
  return { result, summary: JSON.parse(readFileSync(resolve(result.artifactDirectory, 'summary.json'), 'utf8')) };
}
test('scope challenge runner completes six offline mock requests and records mock provenance, exact counts and mandatory review', () => {
  const child = run(['--mock']); assert.equal(child.status, 0, child.stderr);
  const { result, summary } = record(child.stdout);
  assert.equal(result.live, false); assert.equal(summary.totalRequests, 6); assert.equal(summary.automatedPassed, 6);
  assert.equal(summary.reportedInput, 720); assert.equal(summary.reportedOutput, 480);
  assert.equal(summary.heldOut, false); assert.equal(summary.manualReviewRequired, true);
  assert.equal(child.stdout.includes('fictional-mock-key'), false);
});
test('scope challenge runner stops after the first bad result without retries, later cases or provider error output', () => {
  for (const failure of ['http', 'citation', 'classification', 'interactive', 'blank']) {
    const child = run(['--mock', `--mock-failure=${failure}`]); assert.equal(child.status, 1);
    const { summary } = record(child.stdout);
    assert.equal(summary.totalRequests, 1); assert.equal(summary.automatedPassed, 0);
    assert.equal(child.stdout.includes('Unprinted mocked error'), false); assert.equal(child.stdout.includes('revision-count:'), false);
    if (failure !== 'http') { assert.equal(summary.reportedInput, 120); assert.equal(summary.reportedOutput, 80); }
  }
});
test('scope challenge runner rejects conflicting modes and globally enabled AI before any evaluation starts', () => {
  assert.equal(run(['--mock', '--live']).status, 1);
  for (const cases of ['', 'unknown', 'mixed-checkout,mixed-checkout']) assert.equal(run(['--mock', `--cases=${cases}`]).status, 1);
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/run-scope-challenges.ts', '--live', '--inference-id=.fictional-chat_completion'], { env: { ...process.env, NUDGE_AI_ENABLED: 'true', NUDGE_AI_PROVIDER: 'elastic' }, encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 1); assert.equal(result.stdout.includes('artifactDirectory'), false);
  assert.equal(result.stderr.includes('configuration failed'), true);
});
test('explicit scope challenge subset performs only the selected offline request', () => {
  const child = run(['--mock', '--cases=revision-count']); assert.equal(child.status, 0, child.stderr);
  const { result, summary } = record(child.stdout);
  assert.equal(result.totalRequests, 1); assert.equal(summary.caseCount, 1);
  assert.deepEqual(summary.caseIds, ['revision-count']); assert.equal(summary.automatedPassed, 1);
});
