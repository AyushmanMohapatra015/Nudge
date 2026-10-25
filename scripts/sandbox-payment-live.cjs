// Explicit sandbox-only preloader. The launcher supplies the already-recorded finite permission.
const { bindPaymentChild, armDeadline } = require('./sandbox-payment-child.cjs');
if (process.env.NUDGE_PAYMENT_LIVE_CONFIRMATION !== 'one-usd300-sandbox-invoice-and-send') throw Error('Explicit sandbox payment confirmation required');
const transport = globalThis.fetch.bind(globalThis);
const binding = bindPaymentChild(process.env, transport);
globalThis.fetch = binding.fetch;
armDeadline(binding.expiresAt);
