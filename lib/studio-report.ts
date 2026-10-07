import type { AgDataSourcesDefinition, AgReportState } from 'ag-studio';
import type { OwnerAnalytics } from './owner-analytics';
import { money } from './domain';

// Financial totals/grid values stay in cents. A separate USD chart measure is presentation only.
const monetaryField = (id: string, name: string) => ({ id, name, format: 'currencyFormat' as const,
  description: 'Integer USD cents. Quote value is not a payment.', createValueFormatter: () => (value: number) => money(value) });
export function studioData(snapshot: OwnerAnalytics): AgDataSourcesDefinition {
  return { sources: [
    { id: 'invoices', name: 'Invoice balances', fields: [
      { id: 'record', name: 'Invoice', format: 'textFormat' }, { id: 'status', name: 'Recorded status', format: 'textFormat' },
      { id: 'age', name: 'Ageing', format: 'textFormat' }, monetaryField('receivableCents', 'Outstanding USD'),
      { id: 'receivableUsd', name: 'Outstanding USD (chart only)', format: 'currencyFormat', description: 'Presentation-only USD amount. Financial authority is the integer-cent backend totals.' },
      { id: 'dueDate', name: 'Due date (UTC)', format: 'textFormat' },
    ], data: snapshot.invoices.map(row => ({ record: `Invoice ${row.recordIndex + 1}`, status: row.status,
      age: row.ageBucket === 'not-overdue' ? 'Current' : row.ageBucket === 'not-receivable' ? 'Not receivable'
        : row.ageBucket === 'unknown' ? 'Unknown due date' : `${row.ageBucket} days overdue`,
      receivableCents: row.receivableCents, receivableUsd: row.receivableCents / 100, dueDate: row.dueDate ?? 'Unknown' })) },
    { id: 'changes', name: 'Change quotes', fields: [
      { id: 'record', name: 'Change', format: 'textFormat' }, { id: 'status', name: 'Decision status', format: 'textFormat' },
      monetaryField('approvedCents', 'Approved quote USD'),
    ], data: snapshot.changes.map(row => ({ record: `Change ${row.recordIndex + 1}`, status: row.status, approvedCents: row.approvedCents })) },
  ] };
}
export const initialReport: AgReportState = {
  selectedPageId: 'balances', panels: { filters: { collapsed: true }, data: { collapsed: true } },
  pages: [{ id: 'balances', widgets: {
    invoices: { type: 'grid', dataMapping: { cols: [{ id: 'invoices.record' }, { id: 'invoices.status' }, { id: 'invoices.age' }, { id: 'invoices.receivableCents' }, { id: 'invoices.dueDate' }] } },
    ageing: { type: 'bar-chart-grouped', dataMapping: { categoryKey: [{ id: 'invoices.age' }], valueKey: [{ id: 'invoices.receivableUsd', aggregation: 'sum' }] } },
    changes: { type: 'grid', dataMapping: { cols: [{ id: 'changes.record' }, { id: 'changes.status' }, { id: 'changes.approvedCents' }] } },
  }, widgetLayout: {
    invoices: { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 14 },
    ageing: { xTrack: 0, yTrack: 14, xSpan: 12, ySpan: 14 },
    changes: { xTrack: 12, yTrack: 14, xSpan: 12, ySpan: 14 },
  } }],
};
