import { readdirSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

export function reviewBrowserArtifacts(directory, markers) {
  const root = realpathSync(directory);
  if (!Object.keys(markers).length || Object.values(markers).some(v => typeof v !== 'string' || v.length < 24)) throw Error('Invalid synthetic markers.');
  let files = 0, bytes = 0;
  const findings = [], sourceMaps = [];
  function walk(current) {
    for (const entry of readdirSync(current)) {
      const path = resolve(current, entry), stat = lstatSync(path);
      if (stat.isSymbolicLink() || !realpathSync(path).startsWith(root + sep)) throw Error('Unsupported artifact path.');
      if (stat.isDirectory()) { walk(path); continue; }
      if (!stat.isFile() || ++files > 5000 || stat.size > 32 * 1024 * 1024 || (bytes += stat.size) > 256 * 1024 * 1024) throw Error('Artifact limit exceeded.');
      const contents = readFileSync(path);
      const file = relative(root, path).split(sep).join('/');
      if (file.endsWith('.map')) sourceMaps.push(file);
      for (const [category, marker] of Object.entries(markers)) if (contents.includes(Buffer.from(marker))) findings.push({ file, category });
    }
  }
  walk(root);
  if (!files) throw Error('No browser artifacts found.');
  return { files, findings, sourceMaps, success: findings.length === 0 && sourceMaps.length === 0 };
}
