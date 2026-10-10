import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sensitivePath, sourceFindings } from './check-public-source.mjs';

export const emailUsesGithubNoReply = email => /^(?:[^@]+@users\.noreply\.github\.com|noreply@github\.com)$/i.test(email);

export function metadataFindings(commit, authorEmail, committerEmail, message) {
  const findings = [];
  for (const [role, email] of [['author', authorEmail], ['committer', committerEmail]]) {
    if (email && !emailUsesGithubNoReply(email)) findings.push({ commit: commit.slice(0, 12), category: 'non-github-noreply-email', role });
  }
  for (const finding of sourceFindings('commit-message', message)) findings.push({ commit: commit.slice(0, 12), category: finding.category, line: finding.line });
  return findings;
}

export function historyFinding(path, text, finding, id) {
  const line = text.split(/\r?\n/)[finding.line - 1] || '';
  const placeholder = finding.category === 'temporary-public-tunnel' && path === 'README.md' &&
    /https:\/\/YOUR-HOST\.trycloudflare\.com(?:\/|\b)/.test(line) &&
    !/https?:\/\/(?!YOUR-HOST\.trycloudflare\.com)[A-Za-z0-9.-]+\.(?:trycloudflare\.com|ngrok-free\.app|ngrok\.io)\b/i.test(line);
  return { ...finding, object: id.slice(0, 12), review: placeholder ? 'known-documentation-placeholder' : 'needs-private-review' };
}

export function decodeBlobBatch(buffer, expected) {
  const result = []; let offset = 0;
  for (const item of expected) {
    const end = buffer.indexOf(10, offset);
    if (end < 0 || buffer.subarray(offset, end).toString('ascii') !== `${item.id} blob ${item.size}`) throw Error('Unexpected object envelope.');
    const start = end + 1, stop = start + item.size;
    if (stop >= buffer.length || buffer[stop] !== 10) throw Error('Incomplete object envelope.');
    result.push({ id: item.id, text: buffer.subarray(start, stop).toString('utf8') });
    offset = stop + 1;
  }
  if (offset !== buffer.length) throw Error('Unexpected trailing object data.');
  return result;
}

export function checkPublicHistory(root) {
  const directory = realpathSync(root);
  const git = (args, options = {}) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, windowsHide: true, ...options });
  const commits = git(['rev-list', '--all']).trim().split(/\r?\n/).filter(Boolean);
  if (!commits.length || commits.length > 2000 || commits.some(id => !/^[a-f0-9]{40,64}$/.test(id))) throw Error('Unsupported history inventory.');
  const blobs = new Map(), sensitivePaths = new Set(), unsupportedPaths = new Set(), protectedBlobs = new Set();
  for (const commit of commits) {
    for (const entry of git(['ls-tree', '-rz', commit]).split('\0').filter(Boolean)) {
      const match = /^(\d+) (blob|commit) ([a-f0-9]{40,64})\t([\s\S]+)$/.exec(entry);
      if (!match) throw Error('Unsupported tree entry.');
      const [, mode, type, id, path] = match;
      if (sensitivePath(path)) { sensitivePaths.add(path); protectedBlobs.add(id); continue; }
      if (type !== 'blob' || mode !== '100644' && mode !== '100755') { unsupportedPaths.add(path); continue; }
      if (!blobs.has(id)) blobs.set(id, new Set());
      blobs.get(id).add(path);
    }
  }
  for (const id of protectedBlobs) blobs.delete(id);
  if (!blobs.size || blobs.size > 10000) throw Error('History object limit exceeded.');
  const ids = [...blobs.keys()];
  const checked = git(['cat-file', '--batch-check'], { input: ids.join('\n') + '\n' }).trim().split('\n');
  let total = 0;
  const expected = checked.map((line, i) => {
    const match = /^([a-f0-9]{40,64}) blob (\d+)$/.exec(line);
    if (!match || match[1] !== ids[i]) throw Error('Invalid object metadata.');
    const size = Number(match[2]);
    if (!Number.isSafeInteger(size) || size > 2 * 1024 * 1024 || (total += size) > 64 * 1024 * 1024) throw Error('History size limit exceeded.');
    return { id: match[1], size };
  });
  if (expected.length !== ids.length) throw Error('Incomplete object inventory.');
  const content = git(['cat-file', '--batch'], { input: ids.join('\n') + '\n', encoding: null, maxBuffer: 70 * 1024 * 1024 });
  const findings = [];
  for (const blob of decodeBlobBatch(content, expected)) {
    for (const path of blobs.get(blob.id)) for (const f of sourceFindings(path, blob.text)) findings.push(historyFinding(path, blob.text, f, blob.id));
  }
  const fields = git(['log', '--all', '-z', '--format=%H%x00%ae%x00%ce%x00%B']).split('\0');
  if (fields.at(-1) === '') fields.pop();
  if (fields.length !== commits.length * 4) throw Error('Unsupported metadata framing.');
  const metadata = [];
  for (let i = 0; i < fields.length; i += 4) metadata.push(...metadataFindings(fields[i], fields[i + 1], fields[i + 2], fields[i + 3]));
  let configuredEmailUsesNoReply = null;
  try { configuredEmailUsesNoReply = emailUsesGithubNoReply(git(['config', '--get', 'user.email']).trim()); } catch { /* Missing configuration stays unknown. */ }
  return { scope: 'Local ref-reachable commit trees, messages and email categories', commits: commits.length, uniqueBlobsReviewed: ids.length, shallow: git(['rev-parse', '--is-shallow-repository']).trim() === 'true', sensitivePathsNotOpened: [...sensitivePaths], unsupportedPathsNotOpened: [...unsupportedPaths], findings, metadataFindings: metadata, configuredEmailUsesNoReply, namesPublicByGitDesign: true, remoteInspected: false, unreachableObjectsReviewed: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) throw Error('No arguments supported.');
    const report = checkPublicHistory(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
    console.log(JSON.stringify(report, null, 2));
    if (report.findings.some(f => f.review !== 'known-documentation-placeholder') || report.metadataFindings.length || report.sensitivePathsNotOpened.length || report.unsupportedPathsNotOpened.length || report.shallow) process.exitCode = 1;
  } catch {
    console.error('Historical source review could not complete. No matched values or raw errors printed.');
    process.exitCode = 1;
  }
}
