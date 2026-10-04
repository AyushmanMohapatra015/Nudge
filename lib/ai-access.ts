// Credentials are not permission to consume model allowance.
export const realAiEnabled = () => process.env.NUDGE_AI_ENABLED === 'true';
export function requireRealAiAccess() {
  if (!realAiEnabled()) throw new Error('AI calls are paused. Confirm provider allowance before explicitly enabling model requests on the server.');
}
