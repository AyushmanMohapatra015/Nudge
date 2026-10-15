'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BryntumGantt, type BryntumGanttProps } from '@bryntum/gantt-react';
import type { TaskModel } from '@bryntum/gantt';
import type { DeliverySnapshot, DeliveryCalendar } from '@/lib/delivery-plan';
import { deliveryChartTasks } from '@/lib/delivery-view';
import '@bryntum/gantt/fontawesome/css/fontawesome.css';
import '@bryntum/gantt/fontawesome/css/solid.css';
import '@bryntum/gantt/gantt.css';
import '@bryntum/gantt/stockholm-light.css';

const nextDay = (date: string) => new Date(Date.parse(`${date}T00:00:00.000Z`) + 86_400_000).toISOString();
function civil(date: Date | string | null) {
  return date instanceof Date && Number.isFinite(date.getTime()) ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') : null;
}
export default function DeliveryChart({ snapshot, calendar }: { snapshot: DeliverySnapshot; calendar: DeliveryCalendar }) {
  const ref = useRef<BryntumGantt>(null), [status, setStatus] = useState('Preparing read-only timeline.');
  const [failed, setFailed] = useState(false);
  const props = useMemo<BryntumGanttProps>(() => {
    const tasks = deliveryChartTasks(snapshot), ids = new Set(tasks.map(task => task.id));
    const dates = tasks.flatMap(task => [task.startDate, task.endDate]).sort();
    const start = Date.parse(dates[0]), end = Date.parse(dates.at(-1)!);
    return {
      height: 440, readOnly: true, timeZone: 'UTC', viewPreset: 'weekAndDayLetter',
      startDate: new Date(start - 86_400_000), endDate: new Date(Math.max(end, start + 6 * 86_400_000) + 86_400_000),
      columns: [{ type: 'name', field: 'name', width: 240 }],
      cellEditFeature: false, taskEditFeature: false, taskDragFeature: false, taskResizeFeature: false,
      taskDragCreateFeature: false, taskMenuFeature: false, taskTooltipFeature: false, projectLinesFeature: false,
      project: { timeZone: 'UTC', autoLoad: false, autoSync: false, autoSetConstraints: true, hoursPerDay: 24,
        calendar: 'owner-working-days', calendarsData: [{ id: 'owner-working-days', name: 'Owner working days', unspecifiedTimeIsWorking: true,
          intervals: [
            { recurrentStartDate: 'on Sat at 0:00', recurrentEndDate: 'on Mon at 0:00', isWorking: false },
            ...calendar.holidays.map(date => ({ startDate: `${date}T00:00:00.000Z`, endDate: nextDay(date), isWorking: false })),
          ] }], tasksData: tasks,
        dependenciesData: snapshot.dependencies.filter(edge => ids.has(edge.predecessorId) && ids.has(edge.successorId)).map((edge, i) => ({
          id: `dependency-${i}`, from: edge.predecessorId, to: edge.successorId, type: 2,
        })),
      },
    };
  }, [snapshot, calendar]);
  useEffect(() => {
    let disposed = false; const chart = ref.current?.instance;
    if (!chart) return;
    void chart.project.commitAsync().then(() => {
      if (disposed) return;
      const expected = snapshot.tasks.filter(task => task.startDate !== null);
      if (!chart.readOnly || expected.some(task => { const record = chart.taskStore.getById(task.id) as TaskModel | undefined;
        return !record || civil(record.startDate) !== task.startDate || civil(record.endDate) !== task.endDateExclusive; })) {
        setFailed(true); return;
      }
      setStatus('Read-only timeline ready. Saved dates remain in the table below.');
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [snapshot]);
  if (failed) return <p role="alert">The timeline could not preserve the saved dates. Use the date table below; no changes were saved.</p>;
  return <div className="delivery-chart"><p role="status">{status}</p><BryntumGantt {...props} ref={ref} /></div>;
}
