const statsGrid = document.getElementById('stats');
const priorityList = document.getElementById('priorityList');
const opsLog = document.getElementById('opsLog');
const notes = document.getElementById('notes');
const refreshButton = document.getElementById('refreshButton');
const modeLabel = document.getElementById('modeLabel');
const modeSubtext = document.getElementById('modeSubtext');
const hostInfo = document.getElementById('hostInfo');
const gitChanges = document.getElementById('gitChanges');
const workspaceInfo = document.getElementById('workspaceInfo');
const memoryFeed = document.getElementById('memoryFeed');
const openclawOutput = document.getElementById('openclawOutput');
const generatedAtBadge = document.getElementById('generatedAtBadge');
const gitSummaryBadge = document.getElementById('gitSummaryBadge');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderStats(stats) {
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
  gitSummaryBadge.textContent = `${changes.length} item${changes.length === 1 ? '' : 's'}`;
  if (!changes.length) {
    gitChanges.innerHTML = '<div class="muted">Working tree clean.</div>';
    return;
  }

  gitChanges.innerHTML = changes
    .map((line) => `<div class="mono-row">${escapeHtml(line)}</div>`)
    .join('');
}

function renderWorkspace(workspace) {
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
  if (!memory.length) {
    memoryFeed.innerHTML = '<div class="muted">No memory files found yet.</div>';
    return;
  }

  memoryFeed.innerHTML = memory
    .map(
      (entry) => `
        <div>
          <strong>${escapeHtml(entry.file)}</strong>
          <span class="muted">${escapeHtml((entry.highlights || []).join(' • ') || 'No highlights extracted.')}</span>
        </div>
      `
    )
    .join('');
}

function loadNotes() {
  const saved = localStorage.getItem('mission-control-notes');
  if (saved) notes.value = saved;
}

async function refreshDashboard() {
  modeLabel.textContent = 'Refreshing';
  modeSubtext.textContent = 'Pulling a fresh local snapshot…';

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

    openclawOutput.textContent = ((data.openclaw && data.openclaw.summary) || ['No status output']).join('\n');

    const generatedAt = new Date(data.generatedAt);
    generatedAtBadge.textContent = `Updated ${generatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

    hostInfo.textContent = `${data.host.hostname} · ${data.host.os}`;
    modeLabel.textContent = (data.openclaw && data.openclaw.ok) ? 'Nominal' : 'Needs attention';
    modeSubtext.textContent = (data.openclaw && data.openclaw.ok)
      ? 'Live data loaded from local commands.'
      : 'Dashboard loaded, but at least one backend check failed.';
  } catch (error) {
    modeLabel.textContent = 'Offline';
    modeSubtext.textContent = `API error: ${error.message}`;
    openclawOutput.textContent = `Failed to load /api/dashboard\n${error.message}`;
  }
}

notes.addEventListener('input', () => {
  localStorage.setItem('mission-control-notes', notes.value);
});

refreshButton.addEventListener('click', () => {
  refreshDashboard();
});

loadNotes();
refreshDashboard();
