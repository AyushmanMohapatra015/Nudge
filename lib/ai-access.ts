// Credentials are not permission to consume model allowance.
export const realAiEnabled = () => process.env.NUDGE_AI_ENABLED === 'true';
export function aiProviderLabel() {
  switch (process.env.NUDGE_AI_PROVIDER || 'anthropic') {
    case 'anthropic': return 'Anthropic Claude';
    case 'astropods': return 'Astropods gateway';
    case 'elastic': return 'Elastic Agent Builder';
    default: return 'Unrecognized AI provider';
  }
}
export function requireRealAiAccess() {
  if (!realAiEnabled()) throw new Error('AI calls are paused. Confirm provider allowance before explicitly enabling model requests on the server.');
}
