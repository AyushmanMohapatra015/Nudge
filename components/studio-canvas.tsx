'use client';
import { useMemo } from 'react';
import { AgStudio, AgStudioProvider, createWidgets } from 'ag-studio-react';
import { studioTheme, type AgWidgetsConfig, type AgWidgetToolbarItem } from 'ag-studio';
import type { OwnerAnalytics } from '@/lib/owner-analytics';
import { initialReport, studioData } from '@/lib/studio-report';
import type { NudgeStudioRegistry, PendingChangesDefinition, InvoiceChecksDefinition } from '@/lib/studio-registry';
import { PendingChangesContext, StudioPendingChanges } from './studio-pending-changes';
import { InvoiceChecksContext, StudioInvoiceChecks } from './studio-invoice-checks';
import { invoiceChecksSummary } from '@/lib/studio-invoice-checks';

// Keep the built-in actions by ID, with readable accessible names.
const toolbar: AgWidgetToolbarItem[] = [
  { id: 'duplicate', type: 'button', label: 'Duplicate widget', mode: ['edit'], showOnNoData: true },
  { id: 'delete', type: 'button', label: 'Delete widget', mode: ['edit'], showOnNoData: true },
];
const pendingChanges: PendingChangesDefinition = {
  id: 'nudge-pending-changes', label: 'Changes awaiting client acceptance', comp: StudioPendingChanges,
  form: () => [], defaultState: { dataMapping: {} },
  // Widget definitions use pixels; report layouts use track counts.
  defaultSize: { width: 520, height: 280 }, minSize: { width: 280, height: 240 },
  toolbar,
};
const invoiceChecks: InvoiceChecksDefinition = {
  id: 'nudge-invoice-checks', label: 'Invoice checks', comp: StudioInvoiceChecks,
  form: () => [], defaultState: { dataMapping: {} },
  defaultSize: { width: 600, height: 400 }, minSize: { width: 280, height: 260 }, toolbar,
};
const widgets = (defaults: AgWidgetsConfig<NudgeStudioRegistry>): AgWidgetsConfig<NudgeStudioRegistry> => {
  const config = createWidgets<NudgeStudioRegistry>({
    additionalTypes: [pendingChanges, invoiceChecks],
    menu: [...defaults.menu, { label: 'Nudge', widgetIds: ['nudge-pending-changes', 'nudge-invoice-checks'] }],
  });
  return { ...config, widgets: config.widgets.map(definition => {
    if (definition.id !== 'grid' && definition.id !== 'bar-chart-grouped') return definition;
    const existing = (definition.toolbar ?? []).filter(item =>
      (typeof item === 'string' ? item : item.id) !== 'duplicate' && (typeof item === 'string' ? item : item.id) !== 'delete');
    return { ...definition, toolbar: [...existing.map(item => typeof item === 'string' ? item :
      { ...item, label: item.id === 'export' ? 'Export widget data' : item.id === 'download' ? 'Download chart image' : item.label }), ...toolbar] };
  }) };
};

const theme = studioTheme.withParams({ backgroundColor: '#ffffff', foregroundColor: '#263d33',
  accentColor: '#2b6448', browserColorScheme: 'light', fontFamily: 'system-ui, sans-serif' });
export default function StudioCanvas({ snapshot, edit, licenseKey }: { snapshot: OwnerAnalytics; edit: boolean; licenseKey?: string }) {
  const data = useMemo(() => studioData(snapshot), [snapshot]);
  const report = useMemo(() => structuredClone(initialReport), []);
  const checks = useMemo(() => invoiceChecksSummary(snapshot), [snapshot]);
  // No AI module, runner, tools, external source or financial callback registered.
  return <PendingChangesContext.Provider value={snapshot.totals}><InvoiceChecksContext.Provider value={checks}><AgStudioProvider licenseKey={licenseKey}>
    <AgStudio<NudgeStudioRegistry> style={{ height: '100%', width: '100%' }} data={data} initialState={report} widgets={widgets} mode={edit ? 'edit' : 'view'} theme={theme} />
  </AgStudioProvider></InvoiceChecksContext.Provider></PendingChangesContext.Provider>;
}
