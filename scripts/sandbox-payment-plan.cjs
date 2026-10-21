// Pure offline preparation. No credentials, network, persistence, permission renewal or live CLI.
const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { reviewedApproval } = require('./sandbox-rehearsal-controller.cjs');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const reject = () => { throw Error('Matched payment preparation rejected; retain original evidence and attempts.'); };
function prepare({ session, workspace, now = Date.now() }) {
  const s = session.snapshot();
  if (!Number.isSafeInteger(now) || s.phase !== 'review' || now < s.expiresAt || s.approval || s.invoiceId ||
      s.attempts.ai !== 1 || ['oauth', 'create', 'send', 'read'].some(k => s.attempts[k] !== 0) ||
      workspace.proposals?.length !== 1) reject();
  const p = workspace.proposals[0], a = p.analysis, r = p.scopeReview;
  if (a?.classification !== 'additional' || !a.references?.includes('S2') ||
      typeof r?.rationale !== 'string' || r.rationale.trim().length < 20 ||
      !isDeepStrictEqual(p.deliverables, a.deliverables)) reject();
  const dueDate = new Date(now + 7 * 86400000).toISOString().slice(0, 10);
  return {
    schema: 1, kind: 'matched-payment-preparation-only', activationPermitted: false,
    sourceSessionId: s.id, sourceManifestHash: hash(s), sourceWorkspaceHash: hash(workspace),
    preparedOn: new Date(now).toISOString().slice(0, 10),
    originalExpiresAt: s.expiresAt, originalAttempts: structuredClone(s.attempts),
    analysisHash: hash(a), reviewHash: hash(r),
    proposedApproval: reviewedApproval(s.fixture, workspace, p.id, dueDate),
    nextRequired: 'Separately reviewed activation and original-ledger-bound transport; this plan is not a grant.',
  };
}
function verify(plan, input) {
  if (!isDeepStrictEqual(plan, prepare(input))) reject();
  return true;
}
module.exports = { prepare, verify };
