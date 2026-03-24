const statsGrid = document.getElementById('stats');
const priorityList = document.getElementById('priorityList');
const opsLog = document.getElementById('opsLog');
const notes = document.getElementById('notes');
const refreshButton = document.getElementById('refreshButton');
const modeLabel = document.getElementById('modeLabel');
const modeSubtext = document.getElementById('modeSubtext');
const hostInfo = document.getElementById('hostInfo');
const configPath = document.getElementById('configPath');
const gitChanges = document.getElementById('gitChanges');
const workspaceInfo = document.getElementById('workspaceInfo');
const memoryFeed = document.getElementById('memoryFeed');
const openclawOutput = document.getElementById('openclawOutput');
const generatedAtBadge = document.getElementById('generatedAtBadge');
const gitSummaryBadge = document.getElementById('gitSummaryBadge');
const reminderList = document.getElementById('reminderList');
const reminderBadge = document.getElementById('reminderBadge');
const calendarList = document.getElementById('calendarList');
const calendarBadge = document.getElementById('calendarBadge');
const nextEventCard = document.getElementById('nextEventCard');
const nextEventBadge = document.getElementById('nextEventBadge');
const projectList = document.getElementById('projectList');
const projectBadge = document.getElementById('projectBadge');
const serviceList = document.getElementById('serviceList');
const serviceBadge = document.getElementById('serviceBadge');
const quickActions = document.getElementById('quickActions');
const actionOutput = document.getElementById('actionOutput');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setHtml(el, html) {
  if (el) el.innerHTML = html;
}

function setText(el, text) {
  if (el) el.textContent = text;
}

function renderStats(stats) {
  if (!statsGrid) return;
  statsGrid.innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card ${escapeHtml(stat.tone || 'neutral')}">
          <div class="muted small">${escapeHtml(stat.label)}</div>
          <div class="value">${escapeHtml(stat.value)}</div>
          <div class="trend muted">${escapeHtml(stat.trend || '')}</div>
        </article>
      `
    )
    .join('');
}

function renderPriorities(priorities) {
  if (!priorityList) return;
  if (!priorities.length) {
    priorityList.innerHTML = '<li><strong>All clear</strong><span class="muted">No immediate priorities detected.</span></li>';
    return;
  }
  priorityList.innerHTML = priorities
    .map(
      (item) => `
        <li class="${escapeHtml(item.tone || 'neutral')}">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="muted">${escapeHtml(item.detail || '')}</span>
        </li>
      `
    )
    .join('');
}

function renderLog(entries) {
  if (!opsLog) return;
  opsLog.innerHTML = entries
    .map(
      (entry) => `
        <div class="log-entry">
          <div class="timestamp">${escapeHtml(entry.time)}</div>
          <div>${escapeHtml(entry.text)}</div>
        </div>
      `
    )
    .join('');
}

function renderGit(changes) {
  setText(gitSummaryBadge, `${changes.length} item${changes.length === 1 ? '' : 's'}`);
  if (!gitChanges) return;
  if (!changes.length) {
    gitChanges.innerHTML = '<div class="muted">Working tree clean.</div>';
    return;
  }
  gitChanges.innerHTML = changes.map((line) => `<div class="mono-row">${escapeHtml(line)}</div>`).join('');
}

function renderWorkspace(workspace) {
  if (!workspaceInfo) return;
  const disk = workspace.disk || {};
  const items = [
    `<div><strong>Path</strong><span class="muted">${escapeHtml(workspace.path || '')}</span></div>`,
    `<div><strong>Disk</strong><span class="muted">${escapeHtml(String(disk.usedGb || '?'))} GB used / ${escapeHtml(String(disk.totalGb || '?'))} GB total</span></div>`,
    ...(workspace.topLevel || []).map(
      (item) => `<div><strong>${escapeHtml(item.name)}</strong><span class="muted">${escapeHtml(item.type)}</span></div>`
    )
  ];
  workspaceInfo.innerHTML = items.join('');
}

function renderMemory(memory) {
  if (!memoryFeed) return;
  if (!memory.length) {
    memoryFeed.innerHTML = '<div class="muted">No memory files found yet.</div>';
    return;
  }
  memoryFeed.innerHTML = memory
    .map(
      (entry) => `<div><strong>${escapeHtml(entry.file)}</strong><span class="muted">${escapeHtml((entry.highlights || []).join(' • ') || 'No highlights extracted.')}</span></div>`
    )
    .join('');
}

function renderReminders(reminders) {
  setText(reminderBadge, `${reminders.length} job${reminders.length === 1 ? '' : 's'}`);
  if (!reminderList) return;
  if (!reminders.length) {
    reminderList.innerHTML = '<div><strong>No reminders yet</strong><span class="muted">Add jobs with OpenClaw cron and they will appear here.</span></div>';
    return;
  }
  reminderList.innerHTML = reminders
    .map(
      (item) => `<div><strong>${escapeHtml(item.name)}</strong><span class="muted">${escapeHtml(item.when)} · ${escapeHtml(item.enabled ? 'enabled' : 'disabled')} · ${escapeHtml(item.delivery)}</span></div>`
    )
    .join('');
}

function renderNextEvent(nextEvent, source) {
  const sourceLabel = source === 'google' ? 'Google Calendar' : 'Config';
  setText(nextEventBadge, sourceLabel);
  if (!nextEventCard) return;

  if (!nextEvent) {
    nextEventCard.innerHTML = '<div class="muted">No upcoming event found.</div>';
    return;
  }

  nextEventCard.innerHTML = `
    <div class="next-event-time">${escapeHtml(nextEvent.whenDisplay || nextEvent.when || 'TBD')}</div>
    <div class="next-event-title">${escapeHtml(nextEvent.title || 'Event')}</div>
    <div class="muted">${escapeHtml(nextEvent.detail || 'No additional details.')}</div>
  `;
}

function renderCalendar(events, source, error) {
  const sourceLabel = source === 'google' ? 'Google' : 'Config';
  setText(calendarBadge, `${events.length} · ${sourceLabel}`);
  if (!calendarList) return;

  if (!events.length) {
    const emptyMessage = source === 'google'
      ? 'No upcoming Google Calendar events found in the current lookahead window.'
      : 'Edit mission-control/config.json to add upcoming events.';
    calendarList.innerHTML = `<div><strong>No events available</strong><span class="muted">${escapeHtml(emptyMessage)}</span></div>`;
    if (error) {
      calendarList.innerHTML += `<div><strong>Calendar error</strong><span class="muted">${escapeHtml(error)}</span></div>`;
    }
    return;
  }

  calendarList.innerHTML = events
    .map(
      (event) => `
        <div>
          <strong>${escapeHtml(event.title || 'Event')}</strong>
          <span class="muted">${escapeHtml(event.whenDisplay || event.when || 'TBD')} · ${escapeHtml(event.detail || '')}</span>
        </div>
      `
    )
    .join('');

  if (error) {
    calendarList.innerHTML += `<div><strong>Fallback notice</strong><span class="muted">${escapeHtml(error)}</span></div>`;
  }
}

function renderProjects(repos) {
  setText(projectBadge, `${repos.length} repo${repos.length === 1 ? '' : 's'}`);
  if (!projectList) return;
  if (!repos.length) {
    projectList.innerHTML = '<div><strong>No repos configured</strong><span class="muted">Add repo paths in mission-control/config.json.</span></div>';
    return;
  }
  projectList.innerHTML = repos
    .map(
      (repo) => `<div><strong>${escapeHtml(repo.name)}</strong><span class="muted">${escapeHtml(repo.branch || 'unknown')} @ ${escapeHtml(repo.head || 'n/a')} · ${escapeHtml(repo.detail || '')}</span></div>`
    )
    .join('');
}

function renderServices(services) {
  const okCount = services.filter((service) => service.ok).length;
  setText(serviceBadge, `${okCount}/${services.length}`);
  if (!serviceList) return;
  if (!services.length) {
    serviceList.innerHTML = '<div><strong>No service checks configured</strong><span class="muted">Add command-based checks in mission-control/config.json.</span></div>';
    return;
  }
  serviceList.innerHTML = services
    .map(
      (service) => `<div><strong>${escapeHtml(service.name)}</strong><span class="muted">${escapeHtml(service.ok ? 'OK' : 'Issue')} · ${escapeHtml(service.detail || '')}</span></div>`
    )
    .join('');
}

function renderQuickActions(actions) {
  if (!quickActions) return;
  quickActions.innerHTML = actions
    .map(
      (action) => `<button class="secondary action-button" data-action-id="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`
    )
    .join('');

  quickActions.querySelectorAll('[data-action-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const actionId = button.getAttribute('data-action-id');
      button.disabled = true;
      setText(actionOutput, `Running ${actionId}...`);
      try {
        const response = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionId })
        });
        const result = await response.json();
        const lines = [
          `${result.label || actionId}`,
          `Exit code: ${result.code}`,
          '',
          ...(result.stdout || []),
          ...((result.stderr || []).length ? ['', '[stderr]', ...(result.stderr || [])] : [])
        ];
        setText(actionOutput, lines.join('\n').trim());
      } catch (error) {
        setText(actionOutput, `Action failed: ${error.message}`);
      } finally {
        button.disabled = false;
      }
    });
  });
}

function loadNotes() {
  if (!notes) return;
  const saved = localStorage.getItem('mission-control-notes');
  if (saved) notes.value = saved;
}

async function refreshDashboard() {
  setText(modeLabel, 'Refreshing');
  setText(modeSubtext, 'Pulling a fresh local snapshot…');

  try {
    const response = await fetch('/api/dashboard', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    renderStats(data.stats || []);
    renderPriorities(data.priorities || []);
    renderLog(data.opsLog || []);
    renderGit((data.git && data.git.changes) || []);
    renderWorkspace(data.workspace || {});
    renderMemory(data.memory || []);
    renderReminders(data.reminders || []);
    renderNextEvent(data.nextEvent || null, data.calendarSource || 'config');
    renderCalendar(data.calendar || [], data.calendarSource || 'config', data.calendarError || '');
    renderProjects(data.repos || []);
    renderServices(data.services || []);
    renderQuickActions(data.quickActions || []);

    setText(openclawOutput, ((data.openclaw && data.openclaw.summary) || ['No status output']).join('\n'));
    const generatedAt = new Date(data.generatedAt);
    setText(generatedAtBadge, `Updated ${generatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
    setText(hostInfo, `${data.host.hostname} · ${data.host.os}`);
    setText(configPath, data.configPath || 'mission-control/config.json');
    setText(modeLabel, (data.openclaw && data.openclaw.ok) ? 'Nominal' : 'Needs attention');
    setText(
      modeSubtext,
      (data.openclaw && data.openclaw.ok)
        ? 'Live data loaded from local commands and config.'
        : 'Dashboard loaded, but at least one backend check failed.'
    );
  } catch (error) {
    setText(modeLabel, 'Offline');
    setText(modeSubtext, `API error: ${error.message}`);
    setText(openclawOutput, `Failed to load /api/dashboard\n${error.message}`);
    setText(calendarBadge, 'Error');
    setText(nextEventBadge, 'Error');
    setHtml(nextEventCard, `<div class="muted">${escapeHtml(error.message)}</div>`);
    setHtml(calendarList, `<div><strong>Calendar load failed</strong><span class="muted">${escapeHtml(error.message)}</span></div>`);
  }
}

if (notes) {
  notes.addEventListener('input', () => {
    localStorage.setItem('mission-control-notes', notes.value);
  });
}

if (refreshButton) {
  refreshButton.addEventListener('click', refreshDashboard);
}

loadNotes();
refreshDashboard();
