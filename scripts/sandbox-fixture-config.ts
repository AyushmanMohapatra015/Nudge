// Operator-only fixture selection. Never guess from "first paid invoice" or
// fall back to a historical operational ID embedded in public source.
export function sandboxReferenceInvoiceId(value = process.env.NUDGE_SANDBOX_REFERENCE_INVOICE_ID) {
  if (!value || value.length > 100 || !/^INV2-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value)) {
    throw new Error('Configure NUDGE_SANDBOX_REFERENCE_INVOICE_ID privately with the verified sandbox reference invoice ID before fixture operations.');
  }
  return value;
}
