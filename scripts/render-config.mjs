export function renderPort(env) {
  const value = env.PORT || '10000';
  if (!/^\d{1,5}$/.test(value) || Number(value) < 1 || Number(value) > 65535) throw Error('Render PORT must be a valid TCP port.');
  return String(Number(value));
}

export function validateRenderConfig(env, mountInfo) {
  if (env.RENDER !== 'true' || env.NODE_ENV !== 'production') throw Error('Render production environment required.');
  if (env.NUDGE_MODE !== 'sandbox') throw Error('Hosted owner workspace must use sandbox mode; public simulation is not isolated.');
  if (!env.NUDGE_ADMIN_TOKEN || env.NUDGE_ADMIN_TOKEN.trim().length < 24 || env.NUDGE_ADMIN_TOKEN.length > 1024) throw Error('Configure a private random owner token before hosted startup.');
  if (env.NUDGE_DB_PATH !== '/var/data/nudge.sqlite') throw Error('Render database must use the configured persistent disk path.');
  const mounts = mountInfo.split('\n').filter(line => line.includes(' - ')).map(line => line.split(' ')[4]?.replace(/\\(040|011|012|134)/g, (_, code) => String.fromCharCode(parseInt(code, 8))));
  if (!mounts.includes('/var/data')) throw Error('Persistent disk mount not detected; startup refused.');
  if (env.NUDGE_AI_ENABLED !== 'false' && env.NUDGE_AI_ENABLED !== 'true') throw Error('Set the hosted AI enable flag explicitly; use false while allowance is unresolved.');
  if (Object.keys(env).some(key => /^NEXT_PUBLIC_.*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/i.test(key) && env[key])) throw Error('Remove public credential variables before hosted startup.');
  return { port: renderPort(env) };
}
