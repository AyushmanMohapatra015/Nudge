import { constants, closeSync, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import { compareScopeRuns } from '../evaluation/compare-scope-runs';

const limit = 256 * 1024;
let fd: number | undefined;
try {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !args[0]) throw Error();
  const before = lstatSync(args[0]);
  if (before.isSymbolicLink() || !before.isFile() || before.size > limit) throw Error();
  // O_NOFOLLOW closes the final-component swap race on supporting platforms.
  // O_NONBLOCK avoids hanging on a FIFO swapped in after lstat on POSIX.
  fd = openSync(args[0], constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  const opened = fstatSync(fd);
  const after = lstatSync(args[0]);
  if (!opened.isFile() || opened.size > limit || after.isSymbolicLink() || !after.isFile() ||
      before.dev !== opened.dev || before.ino !== opened.ino || after.dev !== opened.dev || after.ino !== opened.ino) throw Error();
  const bytes = Buffer.alloc(limit + 1);
  let used = 0;
  while (used < bytes.length) {
    const count = readSync(fd, bytes, used, bytes.length - used, null);
    if (!count) break;
    used += count;
  }
  if (used > limit) throw Error();
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, used));
  const report = compareScopeRuns(JSON.parse(text));
  closeSync(fd);
  fd = undefined;
  console.log(JSON.stringify(report, null, 2));
} catch {
  console.error('Offline comparison failed. Supply exactly one regular non-symlink JSON file of at most 256 KiB. No provider was called.');
  process.exitCode = 1;
} finally {
  if (fd !== undefined) {
    try { closeSync(fd); } catch { /* Do not expose local paths or OS errors. */ }
  }
}
