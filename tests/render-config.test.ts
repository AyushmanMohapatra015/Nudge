import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { validateRenderConfig } from '../scripts/render-config.mjs';

const mount = '120 30 8:1 / /var/data rw,relatime - ext4 /dev/fictional rw\n';
const env = { RENDER: 'true', NODE_ENV: 'production' as const, NUDGE_MODE: 'sandbox', NUDGE_ADMIN_TOKEN: 'fictional-random-owner-token-for-tests', NUDGE_DB_PATH: '/var/data/nudge.sqlite', NUDGE_AI_ENABLED: 'false', PORT: '10000' };
test('Render preflight rejects public simulation, missing mount, weak owner access and unsafe overrides', () => {
  assert.deepEqual(validateRenderConfig(env, mount), { port: '10000' });
  for (const change of [{ RENDER: '' }, { NODE_ENV: 'development' }, { NUDGE_MODE: 'demo' }, { NUDGE_ADMIN_TOKEN: 'short' }, { NUDGE_ADMIN_TOKEN: ' '.repeat(30) }, { NUDGE_DB_PATH: './data/nudge.sqlite' }, { NUDGE_DB_PATH: '/var/data/../nudge.sqlite' }, { NUDGE_AI_ENABLED: '' }, { PORT: '10000 --hostname external.example' }, { PORT: '65536' }, { NEXT_PUBLIC_ELASTIC_API_KEY: 'fictional-key' }]) {
    assert.throws(() => validateRenderConfig({ ...env, ...change }, mount));
  }
  assert.throws(() => validateRenderConfig(env, ''), /mount/);
  assert.throws(() => validateRenderConfig(env, mount.replace('/var/data ', '/var/database ')), /mount/);
  const child = spawnSync(process.execPath, ['scripts/start-render.mjs', '--override'], { env: { ...process.env, ...env }, encoding: 'utf8', timeout: 5000 });
  assert.equal(child.status, 1); assert.match(child.stderr, /Hosted startup refused/);
  assert.equal(child.stderr.includes(env.NUDGE_ADMIN_TOKEN), false);
  assert.equal(child.stdout, '');
});

test('Render review template keeps provider usage paused and creates no automatic deployments', () => {
  const template = readFileSync('render-blueprint.example.yaml', 'utf8');
  assert.match(template, /autoDeployTrigger: "off"/); assert.match(template, /healthCheckPath: \/api\/health/);
  assert.match(template, /key: NUDGE_AI_ENABLED\s+value: "false"/);
  assert.match(template, /key: NUDGE_MODE\s+value: sandbox/);
  assert.match(template, /key: NUDGE_ADMIN_TOKEN\s+generateValue: true/);
  assert.equal(/(?:api_key|client_secret):\s*\S/i.test(template), false);
});
