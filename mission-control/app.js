const dashboardState = {
  stats: [
    { label: 'Open tasks', value: '04', trend: '2 need action this week' },
    { label: 'Pending reminders', value: '03', trend: '1 due this evening' },
    { label: 'Active projects', value: '02', trend: 'Mission control now online' },
    { label: 'System health', value: 'OK', trend: 'No blockers detected' }
  ],
  priorities: [
    {
      title: 'Wire real data sources',
      detail: 'Replace placeholder stats with calendar, jobs, inbox, or service telemetry.'
    },
    {
      title: 'Pick dashboard host',
      detail: 'Serve locally with a tiny web server, or drop into an existing app shell.'
    },
    {
      title: 'Define what “mission control” means',
      detail: 'Projects, reminders, services, notes, and quick actions are good starting modules.'
    }
  ],
  opsLog: [
    { time: 'Just now', text: 'Mission control scaffold created.' },
    { time: 'Today', text: 'Responsive layout added for desktop and tablet.' },
    { time: 'Today', text: 'Editable notes panel enabled with local browser persistence.' }
  ]
};

const statsGrid = document.getElementById('stats');
const priorityList = document.getElementById('priorityList');
const opsLog = document.getElementById('opsLog');
const notes = document.getElementById('notes');
const refreshButton = document.getElementById('refreshButton');

function renderStats() {
  statsGrid.innerHTML = dashboardState.stats
    .map(
      (stat) => `
        <article class="stat-card">
          <div class="muted small">${stat.label}</div>
          <div class="value">${stat.value}</div>
          <div class="trend muted">${stat.trend}</div>
        </article>
      `
    )
    .join('');
}

function renderPriorities() {
  priorityList.innerHTML = dashboardState.priorities
    .map(
      (item) => `
        <li>
          <strong>${item.title}</strong>
          <span class="muted">${item.detail}</span>
        </li>
      `
    )
    .join('');
}

function renderLog() {
  opsLog.innerHTML = dashboardState.opsLog
    .map(
      (entry) => `
        <div class="log-entry">
          <div class="timestamp">${entry.time}</div>
          <div>${entry.text}</div>
        </div>
      `
    )
    .join('');
}

function loadNotes() {
  const saved = localStorage.getItem('mission-control-notes');
  if (saved) notes.value = saved;
}

notes.addEventListener('input', () => {
  localStorage.setItem('mission-control-notes', notes.value);
});

refreshButton.addEventListener('click', () => {
  const now = new Date();
  dashboardState.opsLog.unshift({
    time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    text: 'Snapshot refreshed.'
  });
  dashboardState.opsLog = dashboardState.opsLog.slice(0, 6);
  renderLog();
});

renderStats();
renderPriorities();
renderLog();
loadNotes();
