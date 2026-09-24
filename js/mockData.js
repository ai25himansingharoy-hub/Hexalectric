// ROADINTEL by Hexalectric Mock Data & Simulation Datasets

// Route R-17 Waypoints (Snapped to Kolkata Arterial Road Corridor: JL Nehru Rd -> SP Mukherjee Rd -> Rashbehari Ave)
const busRoute17 = [
  { lat: 22.5644, lng: 88.3510, name: "Esplanade Bus Station" },
  { lat: 22.5585, lng: 88.3509, name: "JL Nehru Rd (Maidan Metro)" },
  { lat: 22.5512, lng: 88.3508, name: "Park Street Crossing" },
  { lat: 22.5475, lng: 88.3496, name: "Shakespeare Sarani Intersection" },
  { lat: 22.5408, lng: 88.3478, name: "Rabindra Sadan Metro" },
  { lat: 22.5365, lng: 88.3462, name: "Exide Crossing (AJC Bose Rd)" },
  { lat: 22.5302, lng: 88.3458, name: "Ashutosh Mukherjee Rd (Netaji Bhavan)" },
  { lat: 22.5255, lng: 88.3458, name: "Hazra Crossing (SP Mukherjee Rd)" },
  { lat: 22.5183, lng: 88.3457, name: "SP Mukherjee & Rashbehari Corner" },
  { lat: 22.5182, lng: 88.3512, name: "Rashbehari Avenue Corridor" },
  { lat: 22.5181, lng: 88.3556, name: "Deshapriya Park" },
  { lat: 22.5180, lng: 88.3602, name: "Triangular Park" },
  { lat: 22.5179, lng: 88.3665, name: "Gariahat Junction Flyover" }
];

// Pre-populated Road Damage Detections (Snapped directly onto Street Tarmac Centerline)
const initialEvents = [
  {
    id: "EVT-8091",
    eventType: "pothole",
    severity: "high",
    confidence: 0.94,
    busId: "BUS_104",
    routeId: "R_17",
    lat: 22.5512,
    lng: 88.3508,
    locationName: "Park Street & JL Nehru Intersection",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    bbox: [120, 80, 180, 100], // [x, y, w, h]
    status: "pending"
  },
  {
    id: "EVT-8092",
    eventType: "pothole",
    severity: "medium",
    confidence: 0.88,
    busId: "BUS_104",
    routeId: "R_17",
    lat: 22.5408,
    lng: 88.3478,
    locationName: "Rabindra Sadan Flyover Base",
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    bbox: [140, 90, 120, 80],
    status: "pending"
  },
  {
    id: "EVT-8093",
    eventType: "vehicle",
    severity: "medium",
    confidence: 0.91,
    busId: "BUS_202",
    routeId: "R_22",
    lat: 22.5365,
    lng: 88.3462,
    locationName: "Exide Traffic Intersection",
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    bbox: [50, 60, 200, 130],
    status: "pending"
  },
  {
    id: "EVT-8094",
    eventType: "pothole",
    severity: "high",
    confidence: 0.96,
    busId: "BUS_305",
    routeId: "R_08",
    lat: 22.5180,
    lng: 88.3602,
    locationName: "Rashbehari Triangular Park Signal",
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    bbox: [110, 100, 160, 90],
    status: "pending"
  },
  {
    id: "EVT-8095",
    eventType: "pedestrian",
    severity: "low",
    confidence: 0.85,
    busId: "BUS_104",
    routeId: "R_17",
    lat: 22.5179,
    lng: 88.3665,
    locationName: "Gariahat Market Crossing",
    timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    bbox: [220, 50, 70, 140],
    status: "pending"
  }
];

// Render simulated camera frame on canvas with YOLO box
function renderYoloSnapshot(canvas, eventType, confidence, severity) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 240;
  const h = canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : 110;

  // Background asphalt gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Simulated road perspective markings
  ctx.strokeStyle = '#475569';
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 0);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Color based on hazard type
  let boxColor = '#38bdf8'; // blue
  if (eventType === 'pothole') boxColor = '#f43f5e'; // red
  if (eventType === 'vehicle') boxColor = '#fbbf24'; // yellow

  // Draw simulated object / pothole shape
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.6, w * 0.25, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // YOLO Bounding Box
  const bx = w * 0.2;
  const by = h * 0.3;
  const bw = w * 0.6;
  const bh = h * 0.55;

  ctx.strokeStyle = boxColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);

  // YOLO Box Label
  ctx.fillStyle = boxColor;
  ctx.fillRect(bx, by - 18, 110, 18);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(`${eventType.toUpperCase()} ${Math.round(confidence * 100)}%`, bx + 4, by - 5);
}
