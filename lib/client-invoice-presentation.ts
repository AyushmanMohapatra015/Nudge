type ClientInvoicePresentation = {
  label: string;
  balanceCaption: 'Remaining of' | 'Balance of' | 'Reported balance of';
  message: string;
};

// Presentation only: status comes from the server, never from amounts or URLs.
export function clientInvoicePresentation(
  status: string,
  mode: 'demo' | 'sandbox',
): ClientInvoicePresentation {
  switch (status) {
    case 'UNPAID':
    case 'PARTIALLY_PAID':
      return {
        label: status === 'UNPAID' ? 'Payment due' : 'Partially paid',
        balanceCaption: 'Remaining of',
        message: mode === 'demo'
          ? 'This invoice is simulated. Your designer can simulate its payment in the workspace.'
          : 'Your invoice status is shown above. Contact your designer if you need a payment link.',
      };
    case 'PAID':
      return {
        label: 'Settled',
        balanceCaption: 'Balance of',
        message: 'Thank you. This invoice is settled.',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        balanceCaption: 'Reported balance of',
        message: 'This invoice is cancelled.',
      };
    default:
      return {
        label: 'Needs confirmation',
        balanceCaption: 'Reported balance of',
        message: 'Contact your designer to confirm the current invoice status.',
      };
  }
}
