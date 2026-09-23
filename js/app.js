// HEXALECTRIC Main Application Controller

let liveBackendConnected = false;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMap();
  initSimulator();
  renderEventLogFeed();
  updateStats();
  initLiveBackendSync();

  // Event Listeners
  document.getElementById('btnSimulate').addEventListener('click', toggleSimulation);
  document.getElementById('btnReport').addEventListener('click', openReportModal);
  document.getElementById('btnCloseReport').addEventListener('click', closeReportModal);
  document.getElementById('filterEventType').addEventListener('change', applyFilters);
  document.getElementById('filterSeverity').addEventListener('change', applyFilters);
});

// Theme Toggle System (Light / Dark Mode)
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButtonUI(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButtonUI(newTheme);

  if (typeof updateMapTileTheme === 'function') {
    updateMapTileTheme(newTheme);
  }
}

function updateThemeButtonUI(theme) {
  const icon = document.getElementById('themeToggleIcon');
  const text = document.getElementById('themeToggleText');
  if (icon && text) {
    if (theme === 'light') {
      icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      text.innerText = 'Dark Mode';
    } else {
      icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      text.innerText = 'Light Mode';
    }
  }
}

// Periodically sync live pothole events from Python FastAPI backend
function initLiveBackendSync() {
  setInterval(async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) return;

      const data = await response.json();
      if (data && data.events && data.events.length > 0) {
        let newEventsAdded = false;

        data.events.forEach(liveEvt => {
          const exists = simulatedEvents.some(e => e.id === liveEvt.id);
          if (!exists) {
            simulatedEvents.unshift(liveEvt);
            newEventsAdded = true;
          }
        });

        if (newEventsAdded) {
          updateStats();
          applyFilters();
        }
      }

      if (!liveBackendConnected) {
        liveBackendConnected = true;
        const statusPill = document.querySelector('.status-pill');
        if (statusPill) {
          statusPill.innerHTML = '<span class="status-dot"></span><span>LIVE BACKEND ACTIVE</span>';
          statusPill.style.color = '#10b981';
        }
      }
    } catch (err) {
      // Backend not running yet - gracefully fall back to simulation mode
    }
  }, 2000);
}

// Update KPI Stats Cards
function updateStats() {
  const total = simulatedEvents.length;
  const potholes = simulatedEvents.filter(e => e.eventType === 'pothole').length;
  const vehicles = simulatedEvents.filter(e => e.eventType === 'vehicle').length;

  document.getElementById('statTotal').innerText = total;
  document.getElementById('statPotholes').innerText = potholes;
  document.getElementById('statVehicles').innerText = vehicles;
  document.getElementById('statBuses').innerText = liveBackendConnected ? "Live Cam + 3" : "3 Active";
}

// Render Event Feed Log in Sidebar
function renderEventLogFeed(filteredList = simulatedEvents) {
  const feed = document.getElementById('eventFeed');
  if (!feed) return;

  feed.innerHTML = '';

  filteredList.forEach(event => {
    const card = document.createElement('div');
    card.className = `event-card ${event.eventType}`;
    card.innerHTML = `
      <div class="event-info">
        <span class="event-type">${event.eventType}</span>
        <span class="event-meta">${event.locationName}</span>
      </div>
      <span class="confidence-badge">${(event.confidence * 100).toFixed(0)}%</span>
    `;

    card.addEventListener('click', () => {
      focusEventOnMap(event.lat, event.lng);
    });

    feed.appendChild(card);
  });
}

// Apply Sidebar Filters
function applyFilters() {
  const typeVal = document.getElementById('filterEventType').value;
  const severityVal = document.getElementById('filterSeverity').value;

  let filtered = simulatedEvents.filter(e => {
    const matchType = (typeVal === 'all') || (e.eventType === typeVal);
    const matchSeverity = (severityVal === 'all') || (e.severity === severityVal);
    return matchType && matchSeverity;
  });

  renderEventLogFeed(filtered);
  renderEventsOnMap(filtered);
}

// Municipal Report Modal Logic
function openReportModal() {
  const modal = document.getElementById('reportModal');
  const tbody = document.getElementById('reportTableBody');
  const sourceFilter = document.getElementById('reportSourceFilter')?.value || 'all';
  const statusFilter = document.getElementById('reportStatusFilter')?.value || 'all';

  if (tbody) {
    tbody.innerHTML = '';

    let listToRender = simulatedEvents;

    // Filter by Source
    if (sourceFilter === 'live') {
      listToRender = listToRender.filter(evt => evt.id.startsWith('EVT-LIVE-') || evt.busId.includes('MOBILE'));
    }

    // Filter by Status
    if (statusFilter === 'pending') {
      listToRender = listToRender.filter(evt => (evt.status || 'pending') === 'pending');
    } else if (statusFilter === 'resolved') {
      listToRender = listToRender.filter(evt => evt.status === 'resolved');
    }

    if (listToRender.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching pothole records found. All road issues resolved or no live detections yet!</td></tr>`;
    } else {
      listToRender.forEach(evt => {
        const isLive = evt.id.startsWith('EVT-LIVE-') || evt.busId.includes('MOBILE');
        const liveBadge = isLive ? `<span style="font-size: 0.68rem; background: rgba(244,63,94,0.2); color: #f43f5e; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-left: 4px;">LIVE AI</span>` : '';
        const isResolved = evt.status === 'resolved';

        // Photo Snapshot cell HTML
        let snapshotHtml = `<span style="font-size:0.75rem; color:var(--text-muted);">Canvas Sim</span>`;
        if (evt.imageUrl) {
          snapshotHtml = `<img src="${evt.imageUrl}" style="width: 50px; height: 35px; border-radius: 6px; object-fit: cover; border: 1px solid var(--primary); cursor: pointer; transition: transform 0.2s;" onclick="openPhotoModal('${evt.imageUrl}', '${evt.id} (${evt.eventType})', '${evt.locationName}')" title="Click to Expand Photo">`;
        }

        const statusBadge = isResolved
          ? `<span style="font-size:0.72rem; color:#10b981; background:rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); padding:3px 8px; border-radius:12px; font-weight:600;">Resolved</span>`
          : `<span style="font-size:0.72rem; color:#eab308; background:rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.3); padding:3px 8px; border-radius:12px; font-weight:600;">Pending</span>`;

        const actionBtn = isResolved
          ? `<button class="btn btn-outline" style="font-size: 0.72rem; padding: 4px 8px; color: #ef4444; border-color: rgba(239,68,68,0.3);" onclick="deleteEvent('${evt.id}')">Remove</button>`
          : `<button class="btn btn-primary" style="font-size: 0.72rem; padding: 4px 10px; background: #00754A;" onclick="markEventResolved('${evt.id}')">Mark Resolved</button>`;

        const row = document.createElement('tr');
        if (isResolved) row.style.opacity = '0.7';

        row.innerHTML = `
          <td><strong>${evt.id}</strong>${liveBadge}</td>
          <td style="text-align: center;">${snapshotHtml}</td>
          <td style="text-transform: capitalize;">${evt.eventType}</td>
          <td><span class="severity-pill severity-${evt.severity}">${evt.severity}</span></td>
          <td>${evt.locationName}</td>
          <td>${evt.busId}</td>
          <td>${statusBadge}</td>
          <td>${actionBtn}</td>
        `;
        tbody.appendChild(row);
      });
    }
  }

  modal.classList.add('active');
}

// Mark an individual event as resolved
async function markEventResolved(eventId) {
  const evt = simulatedEvents.find(e => e.id === eventId);
  if (evt) {
    evt.status = 'resolved';
  }

  try {
    await fetch(`/api/events/${eventId}/resolve`, { method: 'POST' });
  } catch (err) {
    console.warn("Offline status update:", err);
  }

  updateStats();
  applyFilters();
  openReportModal();
}

// Delete an individual event record
async function deleteEvent(eventId) {
  simulatedEvents = simulatedEvents.filter(e => e.id !== eventId);

  try {
    await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn("Offline delete:", err);
  }

  updateStats();
  applyFilters();
  openReportModal();
}

// Mark all events as resolved
async function resolveAllEvents() {
  simulatedEvents.forEach(evt => evt.status = 'resolved');
  for (const evt of simulatedEvents) {
    try {
      await fetch(`/api/events/${evt.id}/resolve`, { method: 'POST' });
    } catch (e) { }
  }

  updateStats();
  applyFilters();
  openReportModal();
}

// Clear all resolved / completed events from table and database
async function clearResolvedEvents() {
  simulatedEvents = simulatedEvents.filter(evt => evt.status !== 'resolved');

  try {
    await fetch('/api/events/clear-resolved', { method: 'POST' });
  } catch (err) {
    console.warn("Offline clear resolved:", err);
  }

  updateStats();
  applyFilters();
  openReportModal();
}

function closeReportModal() {
  document.getElementById('reportModal').classList.remove('active');
}

function openPhotoModal(imgSrc, title, meta) {
  document.getElementById('photoModalImg').src = imgSrc;
  document.getElementById('photoModalTitle').innerText = title;
  document.getElementById('photoModalMeta').innerText = `Location: ${meta} | Source: Live Camera Node`;
  document.getElementById('photoModal').classList.add('active');
}

function closePhotoModal() {
  document.getElementById('photoModal').classList.remove('active');
}

// Clear initial dummy mock data and keep only live camera AI detections
function clearDemoData() {
  simulatedEvents = simulatedEvents.filter(evt => evt.id.startsWith('EVT-LIVE-') || evt.busId.includes('MOBILE'));
  updateStats();
  applyFilters();
  alert("Demo mock data cleared! Dashboard is now displaying real camera AI detections only.");
}
