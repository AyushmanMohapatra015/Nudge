'use client';
import { useMemo } from 'react';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';
import { studioTheme } from 'ag-studio';
import type { OwnerAnalytics } from '@/lib/owner-analytics';
import { initialReport, studioData } from '@/lib/studio-report';

const theme = studioTheme.withParams({ backgroundColor: '#ffffff', foregroundColor: '#263d33',
  accentColor: '#2b6448', browserColorScheme: 'light', fontFamily: 'system-ui, sans-serif' });
export default function StudioCanvas({ snapshot, edit, licenseKey }: { snapshot: OwnerAnalytics; edit: boolean; licenseKey?: string }) {
  const data = useMemo(() => studioData(snapshot), [snapshot]);
  const report = useMemo(() => structuredClone(initialReport), []);
  // No AI module, runner, tools, external source or financial callback registered.
  return <AgStudioProvider licenseKey={licenseKey}>
    <AgStudio style={{ height: '100%', width: '100%' }} data={data} initialState={report} mode={edit ? 'edit' : 'view'} theme={theme} />
  </AgStudioProvider>;
}
