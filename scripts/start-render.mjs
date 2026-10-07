import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateRenderConfig } from './render-config.mjs';

try {
  if (process.argv.length !== 2 || process.platform !== 'linux') throw Error('Render startup requires Linux with no command-line overrides.');
  const { port } = validateRenderConfig(process.env, readFileSync('/proc/self/mountinfo', 'utf8'));
  const cli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
  const child = spawn(process.execPath, [cli, 'start', '--hostname', '0.0.0.0', '--port', port], { stdio: 'inherit', env: process.env });
  child.once('error', () => { console.error('Unable to start the hosted application.'); process.exitCode = 1; });
  child.once('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { if (child.exitCode === null && child.signalCode === null) child.kill(signal); });
} catch {
  console.error('Hosted startup refused. Check Render runtime, owner access, disk mount and configuration against RENDER_DEPLOYMENT.md. No configuration values printed.');
  process.exitCode = 1;
}
