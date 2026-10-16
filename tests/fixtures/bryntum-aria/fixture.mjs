import { Gantt } from '/vendor/gantt.module.js';

const readOnly = new URLSearchParams(location.search).get('mode') !== 'editable';
const gantt = new Gantt({
  appendTo: 'chart', height: 420, readOnly,
  startDate: new Date(2026, 9, 18), endDate: new Date(2026, 9, 24),
  columns: [{ type: 'name', field: 'name', width: 240 }],
  project: { autoLoad: false, autoSync: false, tasksData: [
    { id: 1, name: 'Fictional task', startDate: new Date(2026, 9, 19), duration: 1 },
  ] },
});
await gantt.project.commitAsync();
window.fixtureReady = { readOnly: gantt.readOnly, count: gantt.taskStore.count };
