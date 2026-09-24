# ROADINTEL by Hexalectric

> **Turning public buses into AI-powered mobile sensors for road-condition detection and GIS-based urban intelligence.**

**Smart India Hackathon 2026**

---

## Overview

Urban roads continuously change due to **potholes, damaged surfaces, traffic conditions, pedestrian activity, and other road hazards**.

Traditional road surveys are often:

* Time-consuming
* Expensive
* Labour-intensive
* Limited in geographic coverage
* Difficult to perform continuously

**HEXALECTRIC** proposes a different approach: use cameras already installed on public buses as a distributed road-monitoring network.

Instead of deploying dedicated survey vehicles, buses travelling through the city can continuously capture road information.

The captured data is processed using:

**Computer Vision + GPS + Geospatial Data + Analytics**

to transform raw camera footage into structured road-condition events and actionable urban intelligence.

---

# Problem

Municipal and traffic authorities need reliable information about:

* ️ Potholes and road damage
* Vehicles and traffic conditions
* Pedestrian activity
* Exact locations of detected events
* ⏱️ Time and frequency of incidents
* Recurring road-condition patterns

However, collecting this information manually across an entire city is difficult.

### The Core Question

> **Can existing public-transport infrastructure be transformed into a continuous, AI-powered road-monitoring system?**

### Our Approach

**Yes — by turning every participating bus into a mobile sensing unit.**

---

# Solution

HEXALECTRIC is designed as a **Bus Camera Intelligence System**.

Each participating bus acts as a mobile sensing unit.

```text
BUS CAMERA
     │
     ▼
VIDEO STREAM
     │
     ▼
FRAME EXTRACTION
     │
     ▼
AI / YOLO
     │
     ├──────────────┬──────────────┐
     ▼              ▼              ▼
  POTHOLES       VEHICLES      PEDESTRIANS
     │              │              │
     └──────────────┴──────────────┘
                    │
                    ▼
             GPS + TIMESTAMP
                    │
                    ▼
               BUS EVENT
                    │
                    ▼
              CENTRAL SERVER
                    │
                    ▼
                 MONGODB
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     GIS DASHBOARD        ANALYTICS
```

The goal is not simply to detect objects.

The goal is to transform:

**Detection → Location → Event → Spatial Analysis → Road Intelligence**

---

# ️ System Architecture

```text
┌──────────────────────┐
│      BUS CAMERA      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   VIDEO PROCESSING   │
│  Frame Extraction    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    AI / YOLO MODEL   │
│                      │
│ Potholes             │
│ Vehicles             │
│ Pedestrians          │
└──────────┬───────────┘
           │
           │ Detection
           ▼
┌──────────────────────┐
│   CONTEXT ENRICHMENT │
│                      │
│ GPS                  │
│ Timestamp            │
│ Bus ID               │
│ Route ID             │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      BUS EVENT       │
└──────────┬───────────┘
           │
           │ Internet
           ▼
┌──────────────────────┐
│    CENTRAL SERVER    │
└──────────┬───────────┘
           │
           ├───────────────────┐
           ▼                   ▼
┌──────────────────────┐ ┌──────────────────┐
│       MongoDB        │ │ Analytics Engine │
│   + Geospatial Data  │ │                  │
└──────────┬───────────┘ └────────┬─────────┘
           │                      │
           └──────────┬───────────┘
                      ▼
             ┌─────────────────┐
             │   GIS DASHBOARD │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │    AUTHORITIES  │
             └─────────────────┘
```

---

# How It Works

## 1.  Capture

A camera mounted on a bus records the road ahead.

```text
Camera → Video Stream
```

---

## 2. ️ Frame Extraction

The video stream is converted into individual frames for AI processing.

```text
Video
  │
  ├── Frame 1
  ├── Frame 2
  ├── Frame 3
  ├── ...
  │
  ▼
Selected Frames
```

Frames can be sampled at an appropriate interval instead of processing every frame.

This can help reduce computational and network requirements.

---

## 3.  AI Detection

Selected frames are processed through the computer-vision model.

Example detection:

```json
{
  "object": "pothole",
  "confidence": 0.91
}
```

Potential detection categories include:

| Detection  | Purpose                                 |
| ---------- | --------------------------------------- |
| Pothole    | Road-condition monitoring               |
| Vehicle    | Traffic intelligence                    |
| Pedestrian | Pedestrian activity and hazard analysis |

---

## 4.  Context Enrichment

AI detections become useful when combined with contextual information.

```text
Detection
    +
GPS
    +
Timestamp
    +
Bus ID
    +
Route ID
    ↓
BUS EVENT
```

Example:

```json
{
  "eventType": "pothole",
  "confidence": 0.91,
  "location": {
    "type": "Point",
    "coordinates": [88.3639, 22.5726]
  },
  "timestamp": "2026-09-03T12:30:45Z",
  "busId": "BUS_104",
  "routeId": "R_17"
}
```

---

# ️ Geospatial Intelligence

Location is a fundamental part of the system.

Instead of storing only:

```text
Pothole detected
```

HEXALECTRIC associates the detection with its geographic position.

```text
POTHOLE
   │
   ▼
EXACT LOCATION
   │
   ▼
ROAD SEGMENT
   │
   ▼
NEIGHBOURING EVENTS
   │
   ▼
SPATIAL HOTSPOT
```

This enables questions such as:

* Where are potholes concentrated?
* Which roads repeatedly show damage?
* Which areas have increasing road-condition events?
* Which road segments may require priority inspection?

---

# ️ Database Architecture

The system is designed around **MongoDB with geospatial indexing**.

MongoDB is suitable for the project because detection events are naturally represented as documents containing:

* Detection information
* Confidence score
* Bus information
* Route information
* Timestamp
* Geographic coordinates
* Frame metadata

### Example Event Document

```json
{
  "_id": "event_001",

  "busId": "BUS_104",
  "routeId": "R_17",

  "eventType": "pothole",
  "confidence": 0.91,

  "location": {
    "type": "Point",
    "coordinates": [88.3639, 22.5726]
  },

  "timestamp": "2026-09-03T12:30:45Z",

  "frame": {
    "frameNumber": 1842
  }
}
```

### Geospatial Index

MongoDB's `2dsphere` index can be used for geographic queries.

```javascript
db.events.createIndex({
  location: "2dsphere"
})
```

This allows operations such as:

```text
Find events near a location
Find potholes within a radius
Find events around a road segment
Identify spatial clusters
```

The geospatial layer is therefore not just a storage mechanism — it forms the foundation of the GIS intelligence layer.

---

# Data Flow

```text
BUS CAMERA
     │
     ▼
VIDEO
     │
     ▼
FRAME EXTRACTION
     │
     ▼
AI / YOLO
     │
     ▼
DETECTION
     │
     ├── Event Type
     ├── Confidence
     └── Bounding Box
     │
     ▼
GPS + TIMESTAMP
     │
     ▼
BUS EVENT
     │
     ▼
BACKEND API
     │
     ▼
MONGODB
     │
     ├── Geospatial Queries
     ├── Historical Data
     └── Event Aggregation
     │
     ▼
ANALYTICS
     │
     ▼
GIS DASHBOARD
     │
     ▼
URBAN INTELLIGENCE
```

---

# GIS Dashboard

The dashboard is intended to provide authorities with a geographic view of detected road events.

### Dashboard Concept

```text
┌──────────────────────────────────────────────┐
│               CITY OVERVIEW                  │
├──────────────┬──────────────┬────────────────┤
│ Total Events │  Potholes    │  Active Buses  │
├──────────────┴──────────────┴────────────────┤
│                                              │
│                  GIS MAP                     │
│                                              │
│        ● Pothole    ● Vehicle                │
│        ● Pedestrian                          │
│                                              │
├──────────────────────────────────────────────┤
│            ROAD CONDITION ANALYTICS          │
├──────────────────────────────────────────────┤
│ Event Trends │ Hotspots │ Priority Roads     │
└──────────────────────────────────────────────┘
```

### Potential Filters

* Event type
* Date range
* Bus
* Route
* Geographic region
* Confidence score
* Severity
* Road segment

---

# From Detection to Decision

The central idea of HEXALECTRIC is that **object detection is only the first step**.

```text
DETECTION
    ↓
LOCATION
    ↓
EVENT
    ↓
DATABASE
    ↓
SPATIAL ANALYSIS
    ↓
HOTSPOT IDENTIFICATION
    ↓
PRIORITIZATION
    ↓
ACTIONABLE URBAN INTELLIGENCE
```

A single detected pothole is useful.

A GIS system that identifies **repeated pothole detections, spatial hotspots, and problematic road segments** is significantly more valuable for urban authorities.

---

# API Design

The backend can expose endpoints such as:

| Method | Endpoint             | Purpose                   |
| ------ | -------------------- | ------------------------- |
| `POST` | `/api/events`        | Create detection event    |
| `GET`  | `/api/events`        | Retrieve events           |
| `GET`  | `/api/events/:id`    | Retrieve a specific event |
| `GET`  | `/api/events/nearby` | Perform geospatial search |
| `GET`  | `/api/analytics`     | Retrieve analytics        |
| `GET`  | `/api/routes`        | Retrieve bus routes       |
| `GET`  | `/api/buses`         | Retrieve bus information  |

### Example Request

```http
POST /api/events
Content-Type: application/json
```

```json
{
  "busId": "BUS_104",
  "routeId": "R_17",
  "eventType": "pothole",
  "confidence": 0.91,
  "location": {
    "type": "Point",
    "coordinates": [88.3639, 22.5726]
  }
}
```

---

# ️ Technology Stack

| Layer                | Technology                 |
| -------------------- | -------------------------- |
| AI / Computer Vision | YOLO                       |
| Programming          | Python                     |
| Backend              | REST API                   |
| Database             | MongoDB                    |
| Geospatial Data      | GeoJSON + MongoDB 2dsphere |
| Frontend             | Web Dashboard              |
| GIS                  | Web-based GIS mapping      |
| Data Analytics       | Python / Backend Analytics |
| Version Control      | Git + GitHub               |

> The exact framework choices for the backend, frontend, and GIS layers will be finalized during implementation.

---

# Project Structure

The repository is planned around modular components:

```text
HEXALECTRIC/
│
├── ai/
│   ├── models/
│   ├── inference/
│   └── detection/
│
├── backend/
│   ├── api/
│   ├── models/
│   └── services/
│
├── database/
│   ├── schemas/
│   ├── indexes/
│   └── seed/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   └── maps/
│
├── analytics/
│   ├── hotspots/
│   └── road_condition/
│
├── data/
│
├── docs/
│
├── tests/
│
├── README.md
└── LICENSE
```

The structure may evolve as the individual modules are implemented.

---

# Current Development Status

HEXALECTRIC is currently under **active development** as a Smart India Hackathon 2026 project.

The architecture and core system design are being established before implementation of the complete pipeline.

### Current Focus

* [x] Define system concept
* [x] Define overall architecture
* [x] Define AI detection pipeline
* [x] Select MongoDB as the database
* [x] Define geospatial event structure
* [ ] Implement MongoDB database
* [ ] Implement event schema
* [ ] Implement YOLO inference
* [ ] Integrate GPS
* [ ] Build backend API
* [ ] Implement geospatial queries
* [ ] Build GIS dashboard
* [ ] Implement analytics
* [ ] Integrate complete pipeline
* [ ] Perform system testing
* [ ] Deploy prototype
* [ ] Prepare SIH demonstration

---

# Future Scope

The architecture can be extended beyond basic detection.

## Road-Damage Severity

Road damage can eventually be classified into levels such as:

```text
Minor → Moderate → Severe
```

---

## Temporal Road Monitoring

Repeated detections from different bus journeys can be compared.

```text
Day 1  → Detected
Day 7  → Detected
Day 14 → Detected
Day 21 → Detected
          ↓
   Persistent Road Issue
```

This can help distinguish isolated detections from recurring road problems.

---

## Predictive Maintenance

Historical detection data can eventually be used to identify roads that may require maintenance attention.

---

## Route-Level Intelligence

Road-condition information can be aggregated to generate condition scores for individual bus routes.

---

## Automated Alerts

The system can eventually notify authorities when:

* Severe road damage is detected
* A spatial hotspot crosses a defined threshold
* Repeated detections occur
* A critical road segment shows deterioration

---

## Multi-City Deployment

The architecture can scale conceptually from:

```text
One Bus
   ↓
One Route
   ↓
One City
   ↓
Multiple Cities
```

---

# Security Considerations

A production deployment should incorporate:

* API authentication
* Role-based authorization
* Secure environment variables
* API rate limiting
* Encrypted communication
* Input validation
* Audit logging

These controls will be implemented as the system moves toward deployment.

---

# Testing Strategy

Testing will cover the major system layers.

### AI

* Detection accuracy
* Precision
* Recall
* False positives
* False negatives
* Inference performance

### Backend

* API validation
* Database operations
* Authentication
* Geospatial queries

### Frontend

* Dashboard rendering
* Map interactions
* Filtering
* API integration

### End-to-End

```text
Camera
  ↓
AI
  ↓
Event
  ↓
API
  ↓
Database
  ↓
GIS
```

The complete pipeline will ultimately be tested as an integrated system.

---

# Expected Impact

## ️ Municipal Authorities

* Faster identification of damaged roads
* Data-driven road inspection
* Spatial prioritization of maintenance
* Historical road-condition analysis

## Traffic Authorities

* Traffic-condition monitoring
* Vehicle-density insights
* Identification of recurring traffic zones

## Public Transit Authorities

* Use existing bus infrastructure as mobile sensors
* Generate additional operational intelligence
* Monitor road conditions along bus routes

## Citizens

* Safer roads
* Faster identification of hazards
* Improved road-maintenance responsiveness

---

# Smart India Hackathon 2026

HEXALECTRIC is being developed as a **Smart India Hackathon 2026** project.

The project demonstrates how existing public-transport infrastructure can be combined with:

**AI + Computer Vision + Geospatial Technology + Data Analytics**

to create a scalable urban road-intelligence platform.

---

# Team

### Smart India Hackathon 2026

**Project:** HEXALECTRIC

**Team:** `HEXALECTRIC`

| Member   | Role                         |
| -------- | ---------------------------- |
| `PARNA KARMAKAR` | AI / Computer Vision         |
| `YASHASWI DE` |  Database  [MONGO DB]         |
| `ARNAB DAS + ANIRBAN PAL + HIMAN SINGHA ROY ` | Frontend                |
| `PARNA KARMAKAR` | ML / Data Analytics          |
| `ANIRBAN PAL` | Integration / Testing        |
| `SANJOLI ROY` | Documentation / Presentation |
| `SANJOLI ROY` | API Integration |
| `HIMAN SINGHA ROY` | GIS |

---

# License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Turning Every Bus Into a Mobile Urban Sensor

**AI • Computer Vision • Geospatial Intelligence • Smart Cities**

</div>
