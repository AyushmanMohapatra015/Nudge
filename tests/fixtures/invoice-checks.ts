import type { Workspace, Invoice } from '../../lib/domain';
export const checksNow = new Date('2026-10-12T12:00:00Z');
export function invoiceChecksFixture(): Workspace {
  const row = (status: Invoice['status'], outstandingCents: number, dueDate: string, index: number): Invoice => ({
    id: `fictional-check-${index}`, proposalId: 'base', status, amountCents: 10000,
    outstandingCents, dueDate, createdAt: '2026-10-01', reminders: 0,
  });
  return { version: 7, mode: 'demo', clientToken: 'fictional-private-token', agreementStatus: 'accepted',
    agreement: { title: 'Fictional project', clientName: 'Fictional client', clientEmail: 'fictional@example.com', amountCents: 10000, clauses: [] },
    policies: { protectedClient: true, reminderLimit: 3, cooldownDays: 7 }, audit: [], proposals: [],
    invoices: [row('OTHER', 100, 'invalid', 0), row('PAID', 200, 'invalid', 1), row('UNPAID', 0, 'invalid', 2),
      row('PARTIALLY_PAID', 0, 'invalid', 3), row('UNPAID', 123, 'invalid', 4), row('PARTIALLY_PAID', 456, '2026-02-30', 5),
      row('DRAFT', 100, 'invalid', 6), row('CANCELLED', 100, 'invalid', 7),
      row('UNPAID', 10000, '2026-10-12', 8), row('UNPAID', 10000, '2026-10-01', 9)] };
}
