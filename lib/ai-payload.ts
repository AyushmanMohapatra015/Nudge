import type { Agreement } from './domain';

// Explicit allowlist: runtime-only workspace metadata must not cross this boundary.
// Free text remains unchanged so clause evidence is faithful; this is not anonymization.
export function scopeAiPayload(request: string, agreement: Agreement) {
  return {
    approvedAgreement: { title: agreement.title, clauses: agreement.clauses.map(({ id, text }) => ({ id, text })) },
    clientRequest: request,
  };
}
