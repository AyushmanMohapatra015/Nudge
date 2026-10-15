import { deliveryViewSchema, type DeliveryView } from './delivery-view';
import type { DeliveryCommand } from './delivery-plan-actions';

export async function readDeliveryResponse(response: Response): Promise<DeliveryView> {
  if (!response.body) throw Error('Invalid delivery snapshot.');
  const stream = response.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true }); let text = '', bytes = 0;
  try {
    for (;;) { const part = await stream.read(); if (part.done) break; bytes += part.value.byteLength;
      if (bytes > 1_048_576) throw Error('Invalid delivery snapshot.'); text += decoder.decode(part.value, { stream: true }); }
    text += decoder.decode(); return deliveryViewSchema.parse(JSON.parse(text));
  } catch (error) { try { await stream.cancel(); } catch { /* cancellation does not prove server rollback */ } throw error; }
}
export function verifyDeliveryOutcome(before: DeliveryView, command: DeliveryCommand, after: DeliveryView) {
  if (after.mode !== before.mode || after.version !== command.expectedWorkspaceVersion + 1) throw Error('Unconfirmed delivery outcome.');
  const previous = before.status === 'ready' ? before.plan : undefined;
  if (command.type === 'stage') {
    if (after.status !== 'ready' || !after.plan.preview || after.previewStale || after.plan.preview.id === command.expectedPreviewId ||
      after.plan.revision !== command.expectedPlanRevision || after.plan.preview.baseWorkspaceVersion !== command.expectedWorkspaceVersion ||
      after.plan.preview.stagedWorkspaceVersion !== after.version) throw Error('Unconfirmed delivery preview.');
  } else if (command.type === 'apply') {
    if (after.status !== 'ready' || after.plan.preview || !after.plan.current || after.plan.revision !== (previous?.revision ?? 0) + 1) throw Error('Unconfirmed delivery apply.');
  } else if (previous?.revision === 0 ? after.status !== 'unconfigured' : after.status !== 'ready' || !!after.plan.preview || after.plan.revision !== previous?.revision) throw Error('Unconfirmed delivery discard.');
  return after;
}
