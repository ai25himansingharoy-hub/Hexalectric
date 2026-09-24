// HEXALECTRIC GIS Map Layer & Marker Controller (with 360° Street View & Spatial Heatmaps)

let map;
let markerGroup;
let heatmapGroup;
let busMarker;
let routePolyline;
let mapTileLayer = null;
let currentViewMode = 'gis';

function initMap() {
  // Center on Kolkata Transit Corridor
  map = L.map('map', {
    center: [22.545, 88.352],
    zoom: 14,
    zoomControl: false
  });

  // Add zoom control at top-left
  L.control.zoom({ position: 'topleft' }).addTo(map);

  const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const tileUrl = initialTheme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  mapTileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  markerGroup = L.layerGroup().addTo(map);
  heatmapGroup = L.layerGroup();

  // Draw Bus Route Polyline (Route R-17)
  const routeCoords = busRoute17.map(pt => [pt.lat, pt.lng]);
  routePolyline = L.polyline(routeCoords, {
    color: '#00754A',
    weight: 4,
    opacity: 0.85,
    dashArray: '8, 8'
  }).addTo(map);

  // Initial Bus Position Marker
  const busIcon = L.divIcon({
    className: 'custom-marker marker-bus',
    html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M4 11h16"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/><path d="M6 19v2"/><path d="M18 19v2"/></svg>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  busMarker = L.marker([busRoute17[0].lat, busRoute17[0].lng], { icon: busIcon }).addTo(map);
  busMarker.bindPopup('<b>BUS_104 (Route R-17)</b><br>Mobile Sensing Unit Active');

  // Load Initial Event Markers
  renderEventsOnMap(simulatedEvents);

  // Invalidate map size on window resize/mobile orientation to prevent blank gray tiles
  window.addEventListener('resize', () => { if (map) map.invalidateSize(); });
  window.addEventListener('orientationchange', () => { setTimeout(() => { if (map) map.invalidateSize(); }, 300); });
  setTimeout(() => { if (map) map.invalidateSize(); }, 300);
  setTimeout(() => { if (map) map.invalidateSize(); }, 1000);
}

// Render Events as Custom Map Pins & Heatmap Clusters
function renderEventsOnMap(eventsList) {
  markerGroup.clearLayers();
  heatmapGroup.clearLayers();

  eventsList.forEach(event => {
    let iconSymbol = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    let iconClass = 'marker-pothole';

    if (event.eventType === 'vehicle') {
      iconSymbol = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M5 17h14v-5l-2-4H7l-2 4v5z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>';
      iconClass = 'marker-vehicle';
    } else if (event.eventType === 'pedestrian') {
      iconSymbol = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="5" r="2"/><path d="M12 7v6m0 0l-3 5m3-5l3 5m-5-9h4"/></svg>';
      iconClass = 'marker-pothole';
    }

    const customIcon = L.divIcon({
      className: `custom-marker ${iconClass}`,
      html: iconSymbol,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([event.lat, event.lng], { icon: customIcon });

    // Popup with YOLO Detection Snapshot + Street View Button
    const popupId = `popup-canvas-${event.id}`;
    const popupHTML = `
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-title">${event.eventType}</span>
          <span class="severity-pill severity-${event.severity}">${event.severity}</span>
        </div>
        <div class="popup-snapshot">
          <canvas id="${popupId}"></canvas>
        </div>
        <div class="popup-details">
          <div><strong>Location:</strong> ${event.locationName}</div>
          <div><strong>Bus ID:</strong> ${event.busId} (${event.routeId})</div>
          <div><strong>Status:</strong> ${event.status === 'resolved' ? '<span style="color:#10b981;">Resolved</span>' : '<span style="color:#eab308;">Pending</span>'}</div>
          <div><strong>Confidence:</strong> ${(event.confidence * 100).toFixed(0)}%</div>
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <button class="btn btn-primary" style="flex: 1; font-size: 0.72rem; padding: 6px;" onclick="openStreetView(${event.lat}, ${event.lng})">
              Street View
            </button>
            <button class="btn btn-outline" style="flex: 1; font-size: 0.72rem; padding: 6px; color: #10b981; border-color: rgba(16,185,129,0.4);" onclick="markEventResolved('${event.id}')">
              Resolve
            </button>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupHTML);

    marker.on('popupopen', () => {
      setTimeout(() => {
        const cvs = document.getElementById(popupId);
        if (cvs) {
          renderYoloSnapshot(cvs, event.eventType, event.confidence, event.severity);
        }
      }, 50);
    });

    markerGroup.addLayer(marker);

    // Heatmap density circles
    const heatColor = event.severity === 'high' ? '#ef4444' : (event.severity === 'medium' ? '#f97316' : '#eab308');
    const heatCircle = L.circle([event.lat, event.lng], {
      radius: event.severity === 'high' ? 180 : 120,
      color: heatColor,
      fillColor: heatColor,
      fillOpacity: 0.45,
      weight: 1
    });
    heatCircle.bindTooltip(`<b>Hazard Cluster: ${event.eventType}</b><br>Severity: ${event.severity}`, { sticky: true });
    heatmapGroup.addLayer(heatCircle);
  });
}

// Switch Map HUD View Modes (GIS View | Heatmap | Route R-17)
function switchMapView(mode) {
  currentViewMode = mode;

  // Update HUD Button Active state
  document.querySelectorAll('.map-hud .hud-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`hudBtn${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
  if (activeBtn) activeBtn.classList.add('active');

  if (mode === 'gis') {
    if (map.hasLayer(heatmapGroup)) map.removeLayer(heatmapGroup);
    if (!map.hasLayer(markerGroup)) map.addLayer(markerGroup);
    map.flyTo([22.545, 88.352], 14, { duration: 1 });
  } else if (mode === 'heatmap') {
    if (map.hasLayer(markerGroup)) map.removeLayer(markerGroup);
    if (!map.hasLayer(heatmapGroup)) map.addLayer(heatmapGroup);
    map.flyTo([22.545, 88.352], 14, { duration: 1 });
  } else if (mode === 'route') {
    if (map.hasLayer(heatmapGroup)) map.removeLayer(heatmapGroup);
    if (!map.hasLayer(markerGroup)) map.addLayer(markerGroup);

    // Fit map bounds to Bus Route R-17
    if (routePolyline) {
      map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
    }
    if (busMarker) {
      setTimeout(() => busMarker.openPopup(), 600);
    }
  }
}

// Open Interactive Street & Spatial Inspection View
function openStreetView(lat, lng) {
  const modal = document.getElementById('streetViewModal');
  const container = document.getElementById('mly');

  if (!modal || !container) return;
  modal.classList.add('active');

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.003}%2C${lat - 0.003}%2C${lng + 0.003}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`;

  container.innerHTML = `
    <iframe 
      width="100%" 
      height="100%" 
      style="border:0; border-radius: 12px;" 
      loading="lazy" 
      src="${osmEmbedUrl}">
    </iframe>
  `;
}

// Close Street View Modal
function closeStreetView() {
  const modal = document.getElementById('streetViewModal');
  if (modal) modal.classList.remove('active');
  const container = document.getElementById('mly');
  if (container) container.innerHTML = '';
}

// Focus map on specific event coordinates
function focusEventOnMap(lat, lng) {
  if (map) {
    switchMapView('gis');
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }
}

// Update map tiles dynamically when user toggles light/dark mode
function updateMapTileTheme(theme) {
  if (!map || !mapTileLayer) return;
  map.removeLayer(mapTileLayer);

  const tileUrl = theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  mapTileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
}

