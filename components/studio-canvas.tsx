'use client';
import { useMemo } from 'react';
import { AgStudio, AgStudioProvider, createWidgets } from 'ag-studio-react';
import { studioTheme, type AgWidgetsConfig } from 'ag-studio';
import type { OwnerAnalytics } from '@/lib/owner-analytics';
import { initialReport, studioData } from '@/lib/studio-report';
import type { NudgeStudioRegistry, PendingChangesDefinition } from '@/lib/studio-registry';
import { PendingChangesContext, StudioPendingChanges } from './studio-pending-changes';

const pendingChanges: PendingChangesDefinition = {
  id: 'nudge-pending-changes', label: 'Changes awaiting client acceptance', comp: StudioPendingChanges,
  form: () => [], defaultState: { dataMapping: {} },
  defaultSize: { width: 24, height: 16 }, minSize: { width: 12, height: 16 },
};
const widgets = (defaults: AgWidgetsConfig<NudgeStudioRegistry>) => createWidgets<NudgeStudioRegistry>({
  additionalTypes: [pendingChanges],
  menu: [...defaults.menu, { label: 'Nudge', widgetIds: ['nudge-pending-changes'] }],
});

const theme = studioTheme.withParams({ backgroundColor: '#ffffff', foregroundColor: '#263d33',
  accentColor: '#2b6448', browserColorScheme: 'light', fontFamily: 'system-ui, sans-serif' });
export default function StudioCanvas({ snapshot, edit, licenseKey }: { snapshot: OwnerAnalytics; edit: boolean; licenseKey?: string }) {
  const data = useMemo(() => studioData(snapshot), [snapshot]);
  const report = useMemo(() => structuredClone(initialReport), []);
  // No AI module, runner, tools, external source or financial callback registered.
  return <PendingChangesContext.Provider value={snapshot.totals}><AgStudioProvider licenseKey={licenseKey}>
    <AgStudio<NudgeStudioRegistry> style={{ height: '100%', width: '100%' }} data={data} initialState={report} widgets={widgets} mode={edit ? 'edit' : 'view'} theme={theme} />
  </AgStudioProvider></PendingChangesContext.Provider>;
}
