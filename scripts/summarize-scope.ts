import { readFileSync, statSync } from 'node:fs';
import { summarizeScope } from '../evaluation/summarize-scope';

try {
  const [file, ...extra] = process.argv.slice(2);
  if (!file || extra.length || statSync(file).size > 262144) throw Error('Invalid file.');
  console.log(JSON.stringify(summarizeScope(JSON.parse(readFileSync(file, 'utf8'))), null, 2));
} catch {
  console.error('Offline summary failed. Supply a JSON array of unique known case IDs and outputs, under 256 KiB. No provider was called; raw input and errors are not printed.');
  process.exitCode = 1;
}
