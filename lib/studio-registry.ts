import type { AgDefaultRegistry, AgWidgetData, AgWidgetDataFormat } from 'ag-studio';
import type { AgWidgetDefinition } from 'ag-studio-react';

type PendingChangesData = AgWidgetData<Record<string, never>, AgWidgetDataFormat<never>> & { type: 'nudge-pending-changes' };
export type PendingChangesDefinition = AgWidgetDefinition<'nudge-pending-changes', PendingChangesData>;
export interface NudgeStudioRegistry extends Omit<AgDefaultRegistry, 'widgets'> {
  widgets: readonly (AgDefaultRegistry['widgets'][number] | PendingChangesDefinition)[];
}
