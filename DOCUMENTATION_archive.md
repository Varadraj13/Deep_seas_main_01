# Strait of Malacca — Maritime Traffic Simulator

## Overview

A single-file interactive maritime traffic simulator built with Leaflet.js and Chart.js. Visualizes 30+ vessels navigating the Strait of Malacca with real-time simulation of shipping routes, cargo economics, emissions tracking, and port analytics.

Includes **MediaPipe hand-tracking gesture control** for hands-free ship manipulation.

---

## How to Run

Open `index.html` in any modern browser (Chrome, Edge, Firefox). No server required — works from `file://`.

---

## Controls

### Simulation
| Control | Action |
|---------|--------|
| **Play/Pause** | Start/stop ship movement |
| **Step** | Advance simulation by one frame |
| **Reset** | Respawn all 30 vessels |
| **Speed slider** | 1x – 50x time acceleration |
| **+ Vessel / - Remove** | Add or remove ships |

### Display Toggles
| Button | Shortcut | Function |
|--------|----------|----------|
| Night | `N` | Dark map filter |
| Trails | `T` | Ship wake trails |
| Routes | `R` | TSS shipping lane overlays |
| Heat | `H` | Traffic density heatmap |
| DB | `B` | Live trade database panel |
| Drag | `D` | Mouse drag mode for ships |
| Hand Mode | `G` | MediaPipe hand tracking |
| EasyHands | `E` | Auto-target nearest ship |

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `+` / `-` | Increase/decrease speed |
| `Escape` | Close all panels, cancel drag |
| `A` | Toggle analytics dashboard |

---

## Features

### Ship Detail Panel
Click any ship to open a side panel with:
- Live telemetry (speed, heading, fuel rate)
- Vessel identity (flag, owner, IMO, MMSI, call sign)
- Technical specs (DWT, length, beam, draft)
- Cargo manifest with load factor
- Route timeline with waypoints
- Emissions estimate (CO2, SOx, NOx)

### Port System
Click any port marker (yellow dots) to view:
- Port statistics (ships/day, capacity, dwell time)
- Incoming/departing traffic
- Cargo processing and commodities
- Economic dashboard with trading partners

### Analytics Dashboard
Click "Analytics Dashboard" at the bottom to see:
- Port throughput chart
- Cargo distribution
- Traffic density over time
- Trade corridor rankings

### Interactive Ship Dragging (Mouse)
1. Click **Drag** button (or press `D`)
2. Click and drag any ship to a new position
3. Preview overlay shows route comparison: distance, time, fuel cost, profit impact
4. Click **Confirm Route** or **Cancel**

### Trade Database
The **DB** panel tracks:
- Total revenue and net profit
- Fleet performance metrics
- Delivery history
- Route efficiency rankings
- Profit over time chart

### Data Export
Under the **Data** tab:
- Export vessel data as JSON or CSV
- Save/load simulation state

---

## Hand Tracking (MediaPipe)

### Requirements
- Webcam access (browser will prompt for permission)
- Internet connection (MediaPipe libraries load from CDN)

### Hand Mode
1. Click **Hand Mode** (or press `G`)
2. Allow camera access when prompted
3. A debug canvas appears in the bottom-right showing your webcam feed with hand skeleton overlay
4. Your index fingertip controls a cursor on the map
5. **Pinch** thumb and index finger together to grab a nearby ship (within 5km)
6. **Drag** with pinch held to move the ship
7. **Release** pinch — the route preview overlay stays open
8. Click **Confirm Route** or **Cancel** with mouse

### Debug Canvas
The camera overlay displays:
- Hand skeleton with colored joints (cyan = index fingertip, orange = thumb tip)
- Dotted line between thumb and index showing pinch distance
- `PINCH: YES/NO` status with distance value
- Name of ship being dragged

### EasyHands Mode
An enhanced mode for effortless ship control:
1. Click **EasyHands** (or press `E`) — auto-enables Hand Mode
2. A **cyan dotted line** points from your cursor to the nearest ship
3. The nearest ship gets a **cyan highlight ring**
4. Target ship name and distance shown on debug canvas
5. **Pinch anywhere** to grab the nearest ship (no distance limit)
6. Works with the same drag preview and confirm/cancel workflow

### Mode Comparison
| Feature | Hand Mode | EasyHands |
|---------|-----------|-----------|
| Grab radius | 5km | Unlimited |
| Targeting line | No | Cyan dotted line |
| Ship highlight | No | Cyan ring |
| Cursor color | Green | Cyan |
| Auto-target info | No | Debug canvas |

---

## Architecture

### Single-File Structure
Everything is in `index.html`:
- **Lines 1–277**: HTML structure and CSS styles
- **Lines 278–660**: HTML panels (controls, ship detail, port detail, analytics, drag overlay, DB stats)
- **Lines 661–2240**: Main JavaScript (data models, map, simulation, UI, database, dragging)
- **Lines 2241–2655**: Hand tracking JavaScript (MediaPipe, gesture control, EasyHands)

### Key Systems
| System | Description |
|--------|-------------|
| **Simulation Engine** | `requestAnimationFrame` loop, speed-scaled time steps |
| **Route System** | 12 pre-generated routes (6 NW-bound, 6 SE-bound) with jitter |
| **Financial Model** | Fuel costs, crew costs, port fees, insurance, freight revenue |
| **Emissions Model** | CO2, SOx, NOx based on fuel type and consumption rate |
| **IndexedDB** | Persistent storage for deliveries, route changes, snapshots |
| **MediaPipe Hands** | Async-loaded, 1-hand tracking, pinch detection |

### Data Models
- **5 ship types**: Tanker, Container, Cargo, Bulk, LNG
- **8 ports**: Singapore, Port Klang, Penang, Belawan, Dumai, Malacca City, Johor Bahru, Batam
- **12 flags**, **20 shipping companies**, **6 fuel types**
- **20+ cargo types** with realistic quantities and values

---

## Bug Fixes Applied

### Critical: `lerp` Function Collision (Chart.js)
- **Problem**: Chart.js 4.4.1 UMD bundle overwrites the global `lerp` function with an incompatible version. Every ship position calculation silently returned `NaN`, freezing all vessels.
- **Fix**: Renamed to `_lerpVal()` to avoid namespace collision.

### MediaPipe Blocking Page Load
- **Problem**: Three synchronous `<script src>` tags for MediaPipe CDN scripts blocked the page if CDN was slow or unreachable, preventing the simulation loop from starting.
- **Fix**: Scripts are now loaded dynamically via async `loadScript()` promises. Simulation starts immediately; hand tracking initializes in the background.

### Animation Loop Resilience
- **Problem**: `requestAnimationFrame(animate)` was called after `updateSim()`. If `updateSim` threw an error, the animation loop died permanently.
- **Fix**: `requestAnimationFrame` is now called first (before `updateSim`), with `updateSim` wrapped in try-catch.

### Position NaN Guards
- **Problem**: If any position calculation produced `NaN` (e.g., zero-length route), `marker.setLatLng([NaN, NaN])` threw a Leaflet error.
- **Fix**: `positionOnRoute()` validates all inputs. `updateSim()` skips vessels with invalid positions and resets their progress.

### Hand Coordinate Mirroring
- **Problem**: Webcam image is mirrored horizontally, so hand cursor position was inverted on the X axis.
- **Fix**: `handToLatLng()` applies `(1 - nx)` to mirror the X coordinate.

---

## Configuration

Key constants that can be tuned:

```javascript
// Simulation
const COLLISION_DIST_NM = 1.5;     // Collision warning distance (nautical miles)

// Hand tracking
const PINCH_THRESHOLD = 0.07;      // Pinch detection sensitivity (lower = tighter)
const GRAB_RADIUS = 5000;          // Normal mode grab distance (meters)
const HAND_SMOOTH = 0.35;          // Cursor smoothing (0-1, lower = smoother)

// Economics
const FUEL_PRICE_PER_TON = 620;    // USD per ton (VLSFO average)
const CREW_COST_PER_HOUR = 250;    // USD per hour
const PORT_FEE_BASE = 15000;       // USD per port call
const INSURANCE_RATE = 0.0003;     // Per cargo value per trip
```

---

## Dependencies (CDN)

| Library | Version | Purpose |
|---------|---------|---------|
| Leaflet | 1.9.4 | Interactive map |
| Chart.js | 4.4.1 | Analytics charts |
| MediaPipe Hands | latest | Hand landmark detection |
| MediaPipe Camera Utils | latest | Webcam capture |
| MediaPipe Drawing Utils | latest | Hand skeleton rendering |
