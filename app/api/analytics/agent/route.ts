import { createStudioAgentPost } from '@/lib/studio-agent-transport';
import { db, mode } from '@/lib/store';
import { ownerAnalytics } from '@/lib/owner-analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Deliberately no adapter: environment flags alone cannot activate this endpoint.
export const POST = createStudioAgentPost({ getSnapshot: () => {
  const row = db().prepare('SELECT body FROM workspaces WHERE mode = ?').get(mode()) as { body: string } | undefined;
  if (!row) throw Error('Snapshot unavailable');
  return ownerAnalytics(JSON.parse(row.body));
} });
