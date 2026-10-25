import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { compareScopeRuns } from '../evaluation/compare-scope-runs';
import { scopeCases } from '../evaluation/scope-cases';
import { summarizeScope } from '../evaluation/summarize-scope';

// Synthetic tool fixtures only. No inference and no independent model evidence.
type System = 'lexical' | 'plain_llm' | 'nudge';
type Label = typeof scopeCases[number]['expected'];
function output(id = '08', classification?: Label) {
  const c = scopeCases.find(c => c.id === id)!;
  return { classification: classification ?? c.expected,
    summary: 'Synthetic fixture for offline bookkeeping; meaning requires manual review.',
    references: [...c.requiredReferences], questions: c.questionRequired ? ['Which scope facts remain unresolved?'] : [],
    deliverables: ['Synthetic requested work'] };
}
function row(system: System = 'lexical', caseId = '08', repeat = 1, saved: unknown = output(caseId)) {
  return { system, caseId, repeat, output: saved };
}
function compare(records: unknown[], expectedRepeats = 1) {
  return compareScopeRuns({ records, expectedRepeats });
}
function present(report: ReturnType<typeof compare>, name: System = 'lexical') {
  const result = report.systems.find(s => s.system === name)!;
  if (result.status !== 'present') throw Error('Expected a present system in synthetic fixture.');
  return result;
}
const generic = /^Invalid offline comparison input\.$/;

test('clean matched systems reuse exact summaries on all 25 fixed cases', () => {
  const records = (['lexical', 'plain_llm', 'nudge'] as const).flatMap(s => scopeCases.map(c => row(s, c.id)));
  const report = compare(records);
  assert.equal(report.submittedSlots, 75);
  assert.equal(report.missingSlotsAllSystems, 0);
  assert.deepEqual(present(report).repeats[0].summary, summarizeScope(scopeCases.map(c => ({ caseId: c.id, output: output(c.id) }))));
  for (const pair of report.matchedComparisons) {
    assert.equal(pair.commonCases, 25);
    assert.equal(pair.leftResults.summary?.correct, 25);
    assert.equal(pair.rightResults.summary?.automatedChecksPassed, 25);
  }
  assert.equal(report.modelRunVerified, false);
  assert.equal(report.heldOutEvaluation, false);
});

test('the full 225-slot envelope preserves repeat boundaries and complete denominators', () => {
  const records = (['lexical', 'plain_llm', 'nudge'] as const).flatMap(system =>
    [1, 2, 3].flatMap(repeat => scopeCases.map(c => row(system, c.id, repeat))));
  const report = compare(records, 3);
  assert.equal(report.submittedSlots, 225);
  assert.equal(report.missingSlotsAllSystems, 0);
  assert.equal(report.matchedComparisons.length, 9);
  for (const system of ['lexical', 'plain_llm', 'nudge'] as const) {
    const result = present(report, system);
    assert.equal(result.stability.allExpectedRepeatsValidCases, 25);
    assert.equal(result.stability.comparableCases, 25);
    assert.equal(result.stability.disagreementCases, 0);
    assert.equal(result.stability.validPredictionSlots, 75);
  }
  for (const pair of report.matchedComparisons) {
    assert.equal(pair.commonCases, 25);
    assert.equal(pair.leftResults.summary?.submitted, 25);
    assert.equal(pair.rightResults.summary?.submitted, 25);
  }
  assert.equal(report.modelRunVerified, false);
});
test('unequal cases and missing repeats expose denominators and no empty summary', () => {
  const report = compare([row(), row('lexical', '01'), row('nudge')], 2);
  const lexical = present(report);
  assert.equal(lexical.expectedSlots, 50);
  assert.equal(lexical.missingSlots, 48);
  assert.equal(lexical.repeats[1].status, 'missing');
  assert.equal(lexical.repeats[1].summary, null);
  assert.equal(lexical.repeats[1].missingSlots, 25);
  const pair = report.matchedComparisons[0];
  assert.deepEqual(pair.commonCaseIds, ['08']);
  assert.equal(pair.leftResults.validOutsideCommon, 1);
  assert.equal(pair.rightResults.missingSlots, 24);
  assert.equal(report.matchedComparisons[1].leftResults.summary, null);
});
test('absent competitors have no measured counts and no matched pairs', () => {
  const report = compare([row()]);
  assert.deepEqual(report.absentSystems, ['plain_llm', 'nudge']);
  assert.deepEqual(report.systems[1], { system: 'plain_llm', status: 'absent' });
  assert.deepEqual(report.matchedComparisons, []);
  assert.equal(report.expectedSlotsPresentSystems, 25);
  assert.equal(report.expectedSlotsAllSystems, 75);
});
test('schema and reference failures cannot enter predictions or matched subsets', () => {
  const bad = [{}, { ...output(), references: ['S99'] }, { ...output(), references: ['S5', 'S5'] }, { ...output(), price: 900 }];
  for (const saved of bad) {
    const report = compare([row('lexical', '08', 1, saved), row('nudge')]);
    assert.equal(present(report).repeats[0].invalidOutputs, 1);
    assert.equal(present(report).stability.validPredictionSlots, 0);
    assert.equal(report.matchedComparisons[0].commonCases, 0);
    assert.equal(report.matchedComparisons[0].leftResults.invalidOutputs, 1);
  }
});
test('classification correctness differs from automated checks and semantic validity', () => {
  const saved = { ...output('01'), references: ['S1'], summary: 'Invented approval and USD 900 terms remain unsafe despite real clause IDs.' };
  const summary = present(compare([row('lexical', '01', 1, saved)])).repeats[0].summary!;
  assert.equal(summary.correct, 1);
  assert.equal(summary.automatedChecksPassed, 0);
  const unsafe = compare([row('lexical', '08', 1, { ...output(), summary: saved.summary })]);
  assert.equal(present(unsafe).repeats[0].summary?.automatedChecksPassed, 1);
  assert.equal(unsafe.manualSemanticReviewRequired, true);
});
test('simulation precedence is preserved even for malformed simulated outputs', () => {
  for (const saved of [{ ...output(), source: 'simulation' }, { source: 'simulation' }]) {
    const report = compare([row('lexical', '08', 1, saved), row('nudge')]);
    const slice = present(report).repeats[0];
    assert.equal(slice.excludedSimulation, 1);
    assert.equal(slice.invalidOutputs, 0);
    assert.equal(slice.validPredictionSlots, 0);
    assert.equal(report.matchedComparisons[0].commonCases, 0);
  }
});
test('source buckets are fixed and group names do not assert provider mismatch', () => {
  const records = [row('plain_llm', '01', 1, { ...output('01'), source: 'elastic' }),
    row('plain_llm', '02', 1, { ...output('02'), source: 'claude' }),
    row('plain_llm', '03'), row('plain_llm', '04', 1, { ...output('04'), source: 'private-source' })];
  const report = compare(records);
  assert.deepEqual(present(report, 'plain_llm').claimedSources, { claude: 1, elastic: 1, simulation: 0, absent: 1, unrecognized: 1 });
  assert.equal(present(report, 'plain_llm').repeats[0].invalidOutputs, 1);
  assert.equal(JSON.stringify(report).includes('private-source'), false);
});
test('strict root rows and telemetry reject extra or missing keys', () => {
  for (const raw of [{ records: [row()], expectedRepeats: 1, secret: 'private' },
    { records: [{ ...row(), secret: 'private' }], expectedRepeats: 1 },
    { records: [{ ...row(), telemetry: { secret: 'private' } }], expectedRepeats: 1 },
    { records: [{ system: 'lexical', caseId: '08', repeat: 1 }], expectedRepeats: 1 },
    { records: [row()], expectedRepeats: 1, [Symbol('private')]: true }]) {
    assert.throws(() => compareScopeRuns(raw), { message: generic });
  }
});
test('duplicate unknown IDs invalid systems and repeat bounds fail generically', () => {
  for (const records of [[row(), row()], [{ ...row(), caseId: '99' }], [{ ...row(), caseId: '8' }],
    [{ ...row(), system: 'private' }], [row('lexical', '08', 0)], [row('lexical', '08', 2)],
    [row('lexical', '08', 1.5)], []]) assert.throws(() => compare(records), { message: generic });
  for (const repeats of [0, 4, 1.5, NaN, Infinity]) assert.throws(() => compare([row()], repeats), { message: generic });
  assert.throws(() => compare(Array.from({ length: 226 }, () => row())), { message: generic });
});
test('stability compares valid predictions with explicit partial coverage', () => {
  const report = compare([row(), row('lexical', '08', 2), row('lexical', '08', 3, output('08', 'included')),
    row('lexical', '01'), row('lexical', '01', 2), row('lexical', '01', 3),
    row('lexical', '02'), row('lexical', '02', 2, {}),
    row('lexical', '03', 1, { ...output('03'), source: 'simulation' })], 3);
  const s = present(report).stability;
  assert.equal(s.allExpectedRepeatsValidCases, 2);
  assert.equal(s.comparableCases, 2);
  assert.equal(s.agreementCases, 1);
  assert.equal(s.disagreementCases, 1);
  assert.equal(s.validPredictionSlots, 7);
  assert.equal(s.invalidOutputs, 1);
  assert.equal(s.excludedSimulation, 1);
  assert.equal(s.missingSlots, 66);
});
test('single repeat never measures agreement even when correct', () => {
  const s = present(compare([row()])).stability;
  assert.equal(s.status, 'not-measured');
  assert.equal(s.allExpectedRepeatsValidCases, 1);
  assert.equal(s.comparableCases, 0);
  assert.equal(s.agreementCases, null);
  assert.equal(s.disagreementCases, null);
});
test('agreement on a repeated wrong prediction is not correctness', () => {
  const wrong = output('08', 'included');
  const report = compare([row('lexical', '08', 1, wrong), row('lexical', '08', 2, wrong)], 2);
  assert.equal(present(report).stability.agreementCases, 1);
  for (const repeat of present(report).repeats) assert.equal(repeat.summary?.correct, 0);
});
test('invalid model output leaves valid neighboring rows visible', () => {
  const slice = present(compare([row('lexical', '01', 1, null), row()])).repeats[0];
  assert.equal(slice.submittedSlots, 2);
  assert.equal(slice.invalidOutputs, 1);
  assert.equal(slice.summary?.correct, 1);
});
test('matched comparisons use like repeat indices with no cross-repeat rescue', () => {
  const report = compare([row('lexical', '08', 1), row('nudge', '08', 2)], 2);
  assert.deepEqual(report.matchedComparisons.map(p => [p.repeat, p.commonCases]), [[1, 0], [2, 0]]);
});
test('all four directional error counts retain original scoring semantics', () => {
  const saved = [row('lexical', '08', 1, output('08', 'included')),
    row('lexical', '01', 1, output('01', 'additional')), row('lexical', '21', 1, output('21', 'additional')),
    row('lexical', '09', 1, output('09', 'ambiguous'))];
  const report = compare([...saved, ...saved.map(r => ({ ...r, system: 'nudge' as const }))]);
  assert.deepEqual(report.matchedComparisons[0].leftResults.summary?.errorCounts,
    { additionalPredictedIncluded: 1, includedPredictedAdditional: 1, ambiguousPredictedDefinite: 1, definitePredictedAmbiguous: 1 });
  assert.equal(report.matchedComparisons[0].leftResults.summary?.correct, 0);
});
test('missing telemetry is unknown and supplied zero is observed', () => {
  const report = compare([{ ...row(), telemetry: { inputTokens: 0, latencyMs: 0 } },
    { ...row('lexical', '01'), telemetry: { outputTokens: 7, latencyMs: 10 } }, row('lexical', '02')]);
  assert.deepEqual(report.telemetry.inputTokens, { observed: 1, missing: 2, total: 0 });
  assert.deepEqual(report.telemetry.outputTokens, { observed: 1, missing: 2, total: 7 });
  assert.deepEqual(report.telemetry.latencyMs, { observed: 2, missing: 1, min: 0, max: 10, mean: 5 });
  assert.equal(present(compare([row()])).telemetry.inputTokens.total, null);
});
test('invalid numeric telemetry and unsafe totals fail rather than invent usage', () => {
  for (const telemetry of [{ inputTokens: -1 }, { inputTokens: 1.5 }, { outputTokens: Infinity },
    { outputTokens: Number.MAX_SAFE_INTEGER + 1 }, { latencyMs: NaN }, { latencyMs: -1 }]) {
    assert.throws(() => compare([{ ...row(), telemetry }]), { message: generic });
  }
  for (const field of ['inputTokens', 'outputTokens', 'latencyMs']) {
    assert.throws(() => compare([{ ...row(), telemetry: { [field]: Number.MAX_SAFE_INTEGER } },
      { ...row('nudge'), telemetry: { [field]: 1 } }]), { message: generic });
  }
  assert.equal(compare([{ ...row(), telemetry: { inputTokens: Number.MAX_SAFE_INTEGER } }]).telemetry.inputTokens.total, Number.MAX_SAFE_INTEGER);
});
test('frozen inputs remain unchanged and ordering is deterministic', () => {
  function freeze(value: unknown): void {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
  }
  const records = [row('nudge', '08', 2), row('lexical', '01'), row('nudge', '01')];
  const raw = { records, expectedRepeats: 2 };
  const before = JSON.stringify(raw);
  freeze(raw);
  const report = compareScopeRuns(raw);
  assert.equal(JSON.stringify(raw), before);
  assert.deepEqual(report, compare([...records].reverse(), 2));
});
test('reports and generic errors never disclose supplied free text or metadata', () => {
  const secret = 'private@example.invalid SECRET-CONTENT';
  const report = compare([row('lexical', '08', 1, { ...output(), summary: secret, questions: [secret], deliverables: [secret] })]);
  assert.equal(JSON.stringify(report).includes(secret), false);
  assert.throws(() => compare([{ ...row(), [secret]: secret }]), e => e instanceof Error && generic.test(e.message) && !e.message.includes(secret));
  assert.equal(present(compare([row('lexical', '08', 1, secret)])).repeats[0].invalidOutputs, 1);
});

function run(args: string[]) {
  const env: NodeJS.ProcessEnv = { NODE_ENV: 'test' };
  for (const [name, value] of Object.entries(process.env)) {
    if (/^(SystemRoot|WINDIR|ComSpec|Path|PATHEXT|TEMP|TMP|USERPROFILE|LOCALAPPDATA|APPDATA|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(name)) env[name] = value;
  }
  env.NODE_OPTIONS = '--require=' + resolve('scripts/postman-no-network.cjs');
  return spawnSync(process.execPath, ['--import', 'tsx', 'scripts/compare-scope-runs.ts', ...args],
    { encoding: 'utf8', timeout: 20000, maxBuffer: 4 * 1024 * 1024, env });
}
function temporary(action: (directory: string) => void) {
  // Preserve bounded fictional artifacts under ignored project data; no recursive deletion.
  const directory = mkdtempSync(resolve('data/scope-comparison-fictional-'));
  action(directory);
}
function failed(args: string[]) {
  const child = run(args);
  assert.equal(child.status, 1);
  assert.equal(child.stdout, '');
  assert.equal(child.stderr.trim(), 'Offline comparison failed. Supply exactly one regular non-symlink JSON file of at most 256 KiB. No provider was called.');
}
test('CLI accepts one synthetic file and prints the pure report only', () => temporary(directory => {
  const file = join(directory, 'synthetic.json');
  const raw = { records: [row()], expectedRepeats: 1 };
  writeFileSync(file, JSON.stringify(raw));
  const child = run([file]);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stderr, '');
  assert.deepEqual(JSON.parse(child.stdout), compareScopeRuns(raw));
}));
test('CLI rejects no arguments extra arguments directories and missing files privately', () => temporary(directory => {
  const file = join(directory, 'synthetic.json');
  writeFileSync(file, JSON.stringify({ records: [row()], expectedRepeats: 1 }));
  for (const args of [[], [file, 'private-extra'], [directory], [join(directory, 'private-missing')]]) failed(args);
}));
test('CLI enforces the byte bound including exact limit and multibyte overflow', () => temporary(directory => {
  const file = join(directory, 'synthetic.json');
  const json = JSON.stringify({ records: [row()], expectedRepeats: 1 });
  writeFileSync(file, json + ' '.repeat(262144 - Buffer.byteLength(json)));
  assert.equal(run([file]).status, 0);
  writeFileSync(file, json + ' '.repeat(262145 - Buffer.byteLength(json)));
  failed([file]);
  writeFileSync(file, 'é'.repeat(140000));
  failed([file]);
}));
test('CLI rejects malformed JSON invalid envelope and malformed UTF-8 privately', () => temporary(directory => {
  const file = join(directory, 'private-synthetic.json');
  for (const bytes of ['SECRET-CONTENT', JSON.stringify({ records: [], expectedRepeats: 1 }), Buffer.from([0xff])]) {
    writeFileSync(file, bytes);
    failed([file]);
  }
}));
test('CLI rejects a final-component symlink when the platform permits creating one', t => temporary(directory => {
  const target = join(directory, 'synthetic.json'), link = join(directory, 'synthetic-link.json');
  writeFileSync(target, JSON.stringify({ records: [row()], expectedRepeats: 1 }));
  try { symlinkSync(target, link, 'file'); } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EPERM' || code === 'EACCES' || code === 'ENOSYS') {
      t.skip('Platform cannot create this symlink: real-platform check remains required.');
      return;
    }
    throw error;
  }
  failed([link]);
}));
