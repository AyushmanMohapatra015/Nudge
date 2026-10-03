// Point a temporary HTTPS tunnel at this relay, never directly at the dashboard.
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export function createWebhookRelay(target = 'http://127.0.0.1:3000', forward = fetch) {
  return createServer(async (request, response) => {
    if (request.url !== '/api/paypal/webhook') {
      response.writeHead(404).end();
      return;
    }
    if (request.method !== 'POST') {
      response.writeHead(405, { Allow: 'POST' }).end();
      return;
    }
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 262144) {
          response.writeHead(413).end();
          return;
        }
        chunks.push(chunk);
      }
      const headers = new Headers({ 'content-type': 'application/json' });
      for (const name of ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time']) {
        const value = request.headers[name];
        if (typeof value === 'string') headers.set(name, value);
      }
      const upstream = await forward(`${target}/api/paypal/webhook`, {
        method: 'POST', headers, body: Buffer.concat(chunks),
        redirect: 'error', signal: AbortSignal.timeout(28000),
      });
      response.writeHead(upstream.status, { 'content-type': 'application/json' });
      response.end(await upstream.text());
    } catch {
      response.writeHead(503, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'Webhook relay unavailable; retry delivery.' }));
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createWebhookRelay();
  server.requestTimeout = 30000;
  server.listen(3001, '127.0.0.1', () => console.log('Webhook-only relay: http://127.0.0.1:3001/api/paypal/webhook. No public tunnel has been started.'));
}
