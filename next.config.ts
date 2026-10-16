import type { NextConfig } from 'next';
import { realpathSync } from 'node:fs';
import { dirname, relative, isAbsolute, sep } from 'node:path';

// Normal runs use the application root. Disposable builds link their freshly
// installed dependencies from a parent source copy: include both explicitly,
// without inferring an unrelated ancestor from its lockfile.
const applicationRoot = realpathSync(process.cwd());
const dependencyRoot = dirname(dirname(realpathSync(require.resolve('next/package.json'))));
let buildRoot = applicationRoot;
for (;;) {
  const path = relative(buildRoot, dependencyRoot);
  if (path !== '..' && !path.startsWith('..' + sep) && !isAbsolute(path)) break;
  const parent = dirname(buildRoot);
  if (parent === buildRoot) throw new Error('Application and dependency roots must share a filesystem root.');
  buildRoot = parent;
}
const config: NextConfig = {
  turbopack: { root: buildRoot },
  outputFileTracingRoot: buildRoot,
  poweredByHeader: false,
  devIndicators: false,
  // Private client tokens live in URLs. Avoid routine request/fetch/browser log forwarding.
  // This is development logging only; hosted access logs need separate configuration.
  logging: false,
  async headers() { return [{ source: '/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'X-Frame-Options', value: 'DENY' }] }]; },
};
export default config;
