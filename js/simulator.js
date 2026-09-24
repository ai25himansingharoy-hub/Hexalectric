// ROADINTEL by Hexalectric Live Bus Movement & AI Pipeline Simulator

let isSimulating = false;
let simulationInterval = null;
let currentWaypointIndex = 0;
let progress = 0;
let dashcamCanvas;
let dashcamCtx;
let simulatedEvents = [...initialEvents];

function initSimulator() {
  dashcamCanvas = document.getElementById('dashcamCanvas');
  if (dashcamCanvas) {
    dashcamCtx = dashcamCanvas.getContext('2d');
    startDashcamFeedLoop();
  }
}

// Toggle Live Simulation Mode
function toggleSimulation() {
  const btn = document.getElementById('btnSimulate');
  isSimulating = !isSimulating;

  if (isSimulating) {
    btn.innerHTML = 'Pause Simulation';
    btn.classList.replace('btn-primary', 'btn-accent');
    startSimulationLoop();
  } else {
    btn.innerHTML = 'Start Bus Simulation';
    btn.classList.replace('btn-accent', 'btn-primary');
    clearInterval(simulationInterval);
  }
}

function startSimulationLoop() {
  simulationInterval = setInterval(() => {
    progress += 0.05;

    if (progress >= 1) {
      progress = 0;
      currentWaypointIndex = (currentWaypointIndex + 1) % (busRoute17.length - 1);
    }

    const startPt = busRoute17[currentWaypointIndex];
    const endPt = busRoute17[currentWaypointIndex + 1];

    const currentLat = startPt.lat + (endPt.lat - startPt.lat) * progress;
    const currentLng = startPt.lng + (endPt.lng - startPt.lng) * progress;

    // Update Bus Marker Position
    if (busMarker) {
      busMarker.setLatLng([currentLat, currentLng]);
      map.panTo([currentLat, currentLng], { animate: true, duration: 0.5 });
    }

    // Trigger random AI detection event along route
    if (Math.random() < 0.12) {
      triggerNewDetectionEvent(currentLat, currentLng, startPt.name);
    }

  }, 400);
}

// Draw animated Dashcam video stream on HUD canvas
function startDashcamFeedLoop() {
  let frameCount = 0;

  function renderFeed() {
    frameCount++;
    if (dashcamCanvas && dashcamCtx) {
      const w = dashcamCanvas.width = dashcamCanvas.parentElement.clientWidth;
      const h = dashcamCanvas.height = dashcamCanvas.parentElement.clientHeight;

      // Dark asphalt / road rendering
      const grad = dashcamCtx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      dashcamCtx.fillStyle = grad;
      dashcamCtx.fillRect(0, 0, w, h);

      // Moving road lines simulation
      dashcamCtx.strokeStyle = '#334155';
      dashcamCtx.lineWidth = 3;
      const lineOffset = (frameCount * 6) % 40;

      for (let y = lineOffset; y < h; y += 40) {
        dashcamCtx.beginPath();
        dashcamCtx.moveTo(w * 0.5, y);
        dashcamCtx.lineTo(w * 0.5, y + 20);
        dashcamCtx.stroke();
      }

      // YOLO Bounding Box Overlay for live detection
      const bx = (w * 0.3) + Math.sin(frameCount * 0.05) * 20;
      const by = h * 0.45;
      const bw = 140;
      const bh = 80;

      // Green / Red YOLO Bounding Box
      dashcamCtx.strokeStyle = isSimulating ? '#f43f5e' : '#10b981';
      dashcamCtx.lineWidth = 2;
      dashcamCtx.strokeRect(bx, by, bw, bh);

      dashcamCtx.fillStyle = isSimulating ? '#f43f5e' : '#10b981';
      dashcamCtx.fillRect(bx, by - 20, 110, 20);
      dashcamCtx.fillStyle = '#ffffff';
      dashcamCtx.font = 'bold 11px JetBrains Mono';
      dashcamCtx.fillText(isSimulating ? 'POTHOLE 93%' : 'SCANNING...', bx + 6, by - 6);

      // HUD Metadata text
      const timeStr = new Date().toLocaleTimeString();
      document.getElementById('dashcamTime').innerText = timeStr;
    }
    requestAnimationFrame(renderFeed);
  }

  requestAnimationFrame(renderFeed);
}

// Generate New Detection Event in Real Time
function triggerNewDetectionEvent(lat, lng, locName) {
  const newEvt = {
    id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
    eventType: "pothole",
    severity: Math.random() > 0.4 ? "high" : "medium",
    confidence: +(0.88 + Math.random() * 0.1).toFixed(2),
    busId: "BUS_104",
    routeId: "R_17",
    lat: lat + (Math.random() - 0.5) * 0.001,
    lng: lng + (Math.random() - 0.5) * 0.001,
    locationName: `Near ${locName}`,
    timestamp: new Date().toISOString(),
    bbox: [100, 80, 150, 90]
  };

  simulatedEvents.unshift(newEvt);
  renderEventsOnMap(simulatedEvents);
  updateStats();
  renderEventLogFeed();
}
