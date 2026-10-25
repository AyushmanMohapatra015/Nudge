import { scopeCases } from './scope-cases';
import { scoreScope } from './score-scope';
import { summarizeScope } from './summarize-scope';

const systems = ['lexical', 'plain_llm', 'nudge'] as const;
type System = typeof systems[number];
type Label = typeof scopeCases[number]['expected'];
type Telemetry = { inputTokens?: number; outputTokens?: number; latencyMs?: number };
type Row = { system: System; caseId: string; repeat: number; output: unknown; telemetry?: Telemetry };
const invalidInput = () => Error('Invalid offline comparison input.');
const ids = scopeCases.map(c => c.id).sort();

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw invalidInput();
  const proto: unknown = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) throw invalidInput();
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[], required: string[]) {
  if (Reflect.ownKeys(value).some(k => typeof k !== 'string' || !allowed.includes(k)) ||
      required.some(k => !Object.hasOwn(value, k))) throw invalidInput();
  // JSON-like data only: reject accessors rather than executing caller code.
  if (Object.values(Object.getOwnPropertyDescriptors(value)).some(d => !('value' in d))) throw invalidInput();
}
function parse(raw: unknown) {
  const root = object(raw);
  keys(root, ['records', 'expectedRepeats'], ['records', 'expectedRepeats']);
  const repeats = root.expectedRepeats;
  if (typeof repeats !== 'number' || !Number.isInteger(repeats) || repeats < 1 || repeats > 3 ||
      !Array.isArray(root.records) || root.records.length < 1 || root.records.length > 225) throw invalidInput();
  const seen = new Set<string>();
  const records: Row[] = [];
  for (const rawRow of root.records) {
    const row = object(rawRow);
    keys(row, ['system', 'caseId', 'repeat', 'output', 'telemetry'], ['system', 'caseId', 'repeat', 'output']);
    if (!systems.includes(row.system as System) || typeof row.caseId !== 'string' || !ids.includes(row.caseId) ||
        typeof row.repeat !== 'number' || !Number.isInteger(row.repeat) || row.repeat < 1 || row.repeat > repeats) throw invalidInput();
    const key = `${row.system}/${row.caseId}/${row.repeat}`;
    if (seen.has(key)) throw invalidInput();
    seen.add(key);
    let telemetry: Telemetry | undefined;
    if (Object.hasOwn(row, 'telemetry')) {
      const supplied = object(row.telemetry);
      keys(supplied, ['inputTokens', 'outputTokens', 'latencyMs'], []);
      telemetry = {};
      for (const field of ['inputTokens', 'outputTokens', 'latencyMs'] as const) {
        if (!Object.hasOwn(supplied, field)) continue;
        const n = supplied[field];
        if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 ||
            (field !== 'latencyMs' && !Number.isSafeInteger(n))) throw invalidInput();
        telemetry[field] = n;
      }
    }
    records.push({ system: row.system as System, caseId: row.caseId, repeat: row.repeat, output: row.output, telemetry });
  }
  records.sort((a, b) => systems.indexOf(a.system) - systems.indexOf(b.system) || a.repeat - b.repeat || a.caseId.localeCompare(b.caseId));
  return { records, repeats };
}
function claimedSource(output: unknown) {
  if (output === null || typeof output !== 'object' || !Object.hasOwn(output, 'source')) return 'absent' as const;
  const source: unknown = (output as { source?: unknown }).source;
  return source === 'claude' || source === 'elastic' || source === 'simulation' ? source : 'unrecognized' as const;
}
function sourceCounts(rows: Row[]) {
  const counts = { claude: 0, elastic: 0, simulation: 0, absent: 0, unrecognized: 0 };
  for (const row of rows) counts[claimedSource(row.output)]++;
  return counts;
}
function prediction(row: Row): Label | null {
  if (claimedSource(row.output) === 'simulation' || scoreScope(row.caseId, row.output).classificationCorrect === null) return null;
  return (row.output as { classification: Label }).classification;
}
function telemetry(rows: Row[]) {
  function observations(field: keyof Telemetry) {
    return rows.flatMap(row => row.telemetry?.[field] === undefined ? [] : [row.telemetry[field]!]);
  }
  function sum(values: number[], integer: boolean) {
    let total = 0;
    for (const n of values) {
      total += n;
      if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER || (integer && !Number.isSafeInteger(total))) throw invalidInput();
    }
    return values.length ? total : null;
  }
  const input = observations('inputTokens'), output = observations('outputTokens'), latency = observations('latencyMs');
  const latencyTotal = sum(latency, false);
  return {
    status: 'reported-not-provider-verified' as const,
    submittedRows: rows.length,
    inputTokens: { observed: input.length, missing: rows.length - input.length, total: sum(input, true) },
    outputTokens: { observed: output.length, missing: rows.length - output.length, total: sum(output, true) },
    latencyMs: { observed: latency.length, missing: rows.length - latency.length,
      min: latency.length ? Math.min(...latency) : null, max: latency.length ? Math.max(...latency) : null,
      mean: latencyTotal === null ? null : latencyTotal / latency.length },
  };
}
function slice(rows: Row[]) {
  const summary = rows.length ? summarizeScope(rows.map(({ caseId, output }) => ({ caseId, output }))) : null;
  return {
    status: rows.length ? 'submitted' as const : 'missing' as const,
    expectedSlots: ids.length, submittedSlots: rows.length, missingSlots: ids.length - rows.length,
    submittedCaseIds: rows.map(r => r.caseId),
    missingCaseIds: ids.filter(id => !rows.some(r => r.caseId === id)),
    validPredictionSlots: summary?.classified ?? 0,
    invalidOutputs: summary?.invalidOutputs ?? 0, excludedSimulation: summary?.excludedSimulation ?? 0,
    claimedSources: sourceCounts(rows), telemetry: telemetry(rows), summary,
  };
}
function stability(rows: Row[], repeats: number) {
  const cases = ids.map(caseId => {
    const selected = rows.filter(r => r.caseId === caseId);
    const valid = selected.flatMap(r => {
      const label = prediction(r);
      return label === null ? [] : [{ repeat: r.repeat, classification: label }];
    });
    const excludedSimulation = selected.filter(r => claimedSource(r.output) === 'simulation').length;
    const comparable = valid.length >= 2;
    return { caseId, validPredictions: valid.length, missingSlots: repeats - selected.length,
      excludedSimulation, invalidOutputs: selected.length - valid.length - excludedSimulation,
      allExpectedRepeatsValid: valid.length === repeats, comparable,
      classificationDisagreement: comparable ? new Set(valid.map(v => v.classification)).size > 1 : null };
  });
  const comparable = cases.filter(c => c.comparable).length;
  const disagreement = cases.filter(c => c.classificationDisagreement === true).length;
  return { status: repeats === 1 ? 'not-measured' as const : 'measured-on-comparable-cases' as const,
    benchmarkCases: ids.length, expectedRepeats: repeats, expectedSlots: ids.length * repeats,
    validPredictionSlots: cases.reduce((n, c) => n + c.validPredictions, 0),
    missingSlots: cases.reduce((n, c) => n + c.missingSlots, 0),
    invalidOutputs: cases.reduce((n, c) => n + c.invalidOutputs, 0),
    excludedSimulation: cases.reduce((n, c) => n + c.excludedSimulation, 0),
    allExpectedRepeatsValidCases: cases.filter(c => c.allExpectedRepeatsValid).length,
    comparableCases: comparable, agreementCases: repeats === 1 ? null : comparable - disagreement,
    disagreementCases: repeats === 1 ? null : disagreement, cases };
}

// Pure saved-output bookkeeping. Existing scorers remain the sole scoring authority.
export function compareScopeRuns(raw: unknown) {
  try {
    const { records, repeats } = parse(raw);
    const present = systems.filter(system => records.some(r => r.system === system));
    const systemReports = systems.map(system => {
      const rows = records.filter(r => r.system === system);
      if (!rows.length) return { system, status: 'absent' as const };
      const expectedSlots = ids.length * repeats;
      return { system, status: 'present' as const, expectedSlots, submittedSlots: rows.length,
        missingSlots: expectedSlots - rows.length,
        submittedCaseIds: ids.filter(id => rows.some(r => r.caseId === id)),
        claimedSources: sourceCounts(rows), telemetry: telemetry(rows),
        repeats: Array.from({ length: repeats }, (_, i) => ({ repeat: i + 1, ...slice(rows.filter(r => r.repeat === i + 1)) })),
        stability: stability(rows, repeats) };
    });
    const matchedComparisons = present.flatMap((left, index) => present.slice(index + 1).flatMap(right =>
      Array.from({ length: repeats }, (_, i) => {
        const repeat = i + 1;
        const a = records.filter(r => r.system === left && r.repeat === repeat);
        const b = records.filter(r => r.system === right && r.repeat === repeat);
        const commonCaseIds = ids.filter(id => a.some(r => r.caseId === id && prediction(r) !== null) &&
          b.some(r => r.caseId === id && prediction(r) !== null));
        function side(rows: Row[]) {
          const common = rows.filter(r => commonCaseIds.includes(r.caseId));
          const valid = rows.filter(r => prediction(r) !== null).length;
          const simulated = rows.filter(r => claimedSource(r.output) === 'simulation').length;
          return { submittedSlots: rows.length, missingSlots: ids.length - rows.length,
            invalidOutputs: rows.length - valid - simulated, excludedSimulation: simulated,
            validOutsideCommon: valid - common.length,
            summary: common.length ? summarizeScope(common.map(({ caseId, output }) => ({ caseId, output }))) : null };
        }
        return { left, right, repeat, benchmarkCases: ids.length, commonCaseIds,
          commonCases: commonCaseIds.length, excludedCaseIds: ids.filter(id => !commonCaseIds.includes(id)),
          excludedCases: ids.length - commonCaseIds.length, leftResults: side(a), rightResults: side(b) };
      })));
    return { taskId: 'PA-4', packetRevision: 'B2', expectedRepeats: repeats, benchmarkCases: ids.length,
      expectedSlotsAllSystems: ids.length * repeats * systems.length,
      expectedSlotsPresentSystems: ids.length * repeats * present.length,
      submittedSlots: records.length, missingSlotsAllSystems: ids.length * repeats * systems.length - records.length,
      absentSystems: systems.filter(s => !present.includes(s)), systems: systemReports, matchedComparisons,
      telemetry: telemetry(records), manualSemanticReviewRequired: true as const,
      modelRunVerified: false as const, heldOutEvaluation: false as const,
      limitations: [
        'Saved caller-labelled groups and claimed sources do not authenticate execution or providers.',
        'Development-visible fictional cases; this companion supplies no new measured model results.',
        'Agreement is not correctness. Structural citation validity does not establish semantic support.',
        'Directional errors are counts only; no weights, monetary losses, composite winner or superiority claim.',
        'Telemetry is supplied observation only; missing is unknown; no billing or budget guarantee.',
      ] };
  } catch {
    // Neither parser/scorer exceptions nor caller content may escape in errors.
    throw invalidInput();
  }
}
