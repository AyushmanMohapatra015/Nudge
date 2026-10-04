// Offline saved-output scorer. No environment keys, models, workspace or PayPal access.
import { readFileSync, statSync } from 'node:fs';
import { scoreScope } from '../evaluation/score-scope';
try {
  const [caseId, file, ...extra] = process.argv.slice(2);
  if (!caseId || !/^\d{2}$/.test(caseId) || !file || extra.length) throw Error('Invalid arguments.');
  if (statSync(file).size > 65536) throw Error('Output too large.');
  const result = scoreScope(caseId, JSON.parse(readFileSync(file, 'utf8')));
  console.log(JSON.stringify(result, null, 2));
  if (!result.automatedChecksPassed) process.exitCode = 1;
} catch { console.error('Offline scoring failed. Supply a known two-digit case ID and a saved JSON analysis under 64 KiB. No provider was called.'); process.exitCode = 1; }
