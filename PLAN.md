# Metal Birds Watch

A web application that shows real-time notifications when planes fly over your location.

## Challenge

- **Event:** GitHub Copilot CLI Challenge on dev.to
- **Deadline:** February 15, 2026 (11:59 PM PT)
- **URL:** https://dev.to/challenges/github-2026-01-21

## Core Concept

User opens the website → sees a map with their location → gets notifications when planes fly overhead (within 10km radius).

---

## Architecture

### High-Level Overview

```
┌─────────────┐      every 30s      ┌─────────────────┐
│  OpenSky    │ ◄────────────────── │    Backend      │
│  API        │                     │  (Node/Express) │
└─────────────┘                     └────────┬────────┘
                                             │
                                             │ cached data
                        ┌────────────────────┼────────────────────┐
                        ▼                    ▼                    ▼
                   ┌─────────┐          ┌─────────┐          ┌─────────┐
                   │ User A  │          │ User B  │          │ User C  │
                   │ Browser │          │ Browser │          │ Browser │
                   └─────────┘          └─────────┘          └─────────┘
```

### Why Backend + Cache?

- OpenSky API has rate limits (4,000 calls/day for registered users)
- Multiple users would exhaust limits quickly
- Solution: Server fetches once, caches, serves all users from cache

---

## Frontend-Backend Communication

### Smart Polling (Server Tells Client When to Poll)

Instead of polling at fixed intervals, the server tells the client exactly when to poll next based on cache freshness.

### Server Response Format

```json
{
  "planes": [
    { "callsign": "AFR123", "lat": 48.891, "lon": 2.412, "altitude": 2400 },
    { "callsign": "EZY456", "lat": 48.823, "lon": 2.358, "altitude": 8100 }
  ],
  "cacheAge": 12,
  "nextUpdateIn": 18
}
```

| Field | Meaning |
|-------|---------|
| `planes` | The flight data |
| `cacheAge` | How old the cache is (seconds) |
| `nextUpdateIn` | When client should poll again (seconds) |

### Why This Approach?

| Fixed Polling (Bad) | Smart Polling (Good) |
|---------------------|----------------------|
| Poll every 5s, cache is 30s | Poll only when data will be fresh |
| 5 out of 6 requests return same data | Every request gets new data |
| Wastes bandwidth | Efficient |

### Timeline Example

```
CACHE TTL = 30 seconds

T=0:  Cache created (fresh fetch from OpenSky)

T=12: User A connects
      Server responds: { planes: [...], cacheAge: 12, nextUpdateIn: 18 }
      User A sets timer for 18 seconds

T=25: User B connects
      Server responds: { planes: [...], cacheAge: 25, nextUpdateIn: 5 }
      User B sets timer for 5 seconds

T=30: Cache expires
      User A polls → triggers fresh fetch
      User B polls → gets fresh data
```

### Client Logic

```javascript
async function fetchPlanes() {
  const response = await fetch('/api/planes', {
    method: 'POST',
    body: JSON.stringify({ lat: myLat, lon: myLon })
  });

  const data = await response.json();

  // Update map with planes
  updateMap(data.planes);

  // Schedule next poll based on server's instruction
  const nextPoll = data.nextUpdateIn * 1000; // convert to ms
  setTimeout(fetchPlanes, nextPoll);
}

// Start polling
fetchPlanes();
```

---

## User Management

### No Registration Required

The server is completely stateless. No user accounts, no sessions, no cookies.

| Data | Stored Where | Notes |
|------|--------------|-------|
| User's GPS location | Sent with each request | Not stored on server |
| View radius preference | Client (localStorage) | User adjustable |
| Notified planes list | Client (memory) | To avoid repeat notifications |
| Sound on/off | Client (localStorage) | User preference |

### Why No Registration?

| Benefit | Explanation |
|---------|-------------|
| Simpler | No auth logic, no user database |
| Privacy | User location never stored on server |
| Faster | No login flow, instant usage |
| Less code | Fewer bugs, faster delivery |

### Server Perspective

```
Every request is independent:

POST /api/planes { lat: 48.85, lon: 2.35 }
    │
    ▼
Server doesn't know or care WHO is asking
Just returns planes for that location
    │
    ▼
{ planes: [...], nextUpdateIn: 18 }
```

---

## Security & Abuse Protection

### Threat Model

| Attack | Description |
|--------|-------------|
| Spam requests | Single IP floods server |
| Cache busting | Different locations to force API calls |
| DDoS | Overwhelm server resources |
| API quota exhaustion | Drain OpenSky API limits |

### Protection 1: Rate Limiting Per IP

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 30 * 1000,  // 30 seconds
  max: 5,               // 5 requests per window
  message: { error: 'Too many requests' }
});

app.use('/api/planes', limiter);
```

```
IP: 1.2.3.4
├── Request 1   ✅
├── Request 2   ✅
├── Request 3   ✅
├── Request 4   ✅
├── Request 5   ✅
├── Request 6   ❌ BLOCKED
└── ... wait 30s ...
├── Request 7   ✅
```

### Protection 2: Limit Unique Locations Per IP

Prevents attackers from requesting many different locations to bust cache.

```javascript
const ipLocations = new Map();  // IP → Set of grid keys
const MAX_LOCATIONS_PER_IP = 3;

app.post('/api/planes', (req, res) => {
  const ip = req.ip;
  const gridKey = getGridKey(req.body.lat, req.body.lon);

  if (!ipLocations.has(ip)) {
    ipLocations.set(ip, new Set());
  }
  const locations = ipLocations.get(ip);

  if (!locations.has(gridKey) && locations.size >= MAX_LOCATIONS_PER_IP) {
    return res.status(429).json({
      error: 'Too many different locations'
    });
  }

  locations.add(gridKey);
  // Continue...
});
```

```
Attacker tries:
Request 1: Paris     → Location 1 ✅
Request 2: Lyon      → Location 2 ✅
Request 3: London    → Location 3 ✅
Request 4: New York  → ❌ BLOCKED (max 3 locations per IP)
```

### Protection 3: Global API Call Limit

Even with per-IP limits, cap total OpenSky calls to protect API quota.

```javascript
let apiCallsThisMinute = 0;
const MAX_CALLS_PER_MINUTE = 20;

setInterval(() => {
  apiCallsThisMinute = 0;
}, 60 * 1000);

async function fetchFromOpenSky(lat, lon) {
  if (apiCallsThisMinute >= MAX_CALLS_PER_MINUTE) {
    throw new Error('API rate limit reached');
  }

  apiCallsThisMinute++;
  // ... make API call
}
```

```
20 calls/minute × 60 minutes × 24 hours = 28,800 max theoretical
Real usage will be much lower = safe within 4,000/day limit
```

### Protection 4: Input Validation

```javascript
app.post('/api/planes', (req, res) => {
  const { lat, lon } = req.body;

  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    return res.status(400).json({ error: 'Invalid latitude' });
  }

  if (typeof lon !== 'number' || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Invalid longitude' });
  }

  // Continue...
});
```

### Protection 5: CORS

Only allow requests from your frontend domain.

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://metalbirdsover.me'
}));
```

### Complete Protection Flow

```
Request comes in
       │
       ▼
┌──────────────────────────────┐
│ Rate limit check (5 per 30s) │
│  BLOCKED? → 429 error        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Input validation             │
│  Invalid? → 400 error        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Location limit (3 per IP)    │
│  Too many? → 429 error       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Cache check                  │
│  Fresh? → Return cached data │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Global API limit (20/min)    │
│  Exceeded? → 503 or stale    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Fetch from OpenSky           │
│ Cache it, return to user     │
└──────────────────────────────┘
```

---

## Key Design Decisions

### 1. Grid-Based Caching

Users are grouped by rounding their coordinates to nearest 0.2°:

```
User at (48.8712, 2.3891) → Cache key "48.8_2.4"
User at (48.8234, 2.4102) → Cache key "48.8_2.4" (same!)
```

Users in the same grid cell share the same cached data.

### 2. Server Fetches Rectangle, Client Filters Circle

```
SERVER                              CLIENT
──────                              ──────
Fetches 25km radius rectangle  →    Filters to 10km circle
(what API supports)                 (what user actually sees)
```

**Why?**
- Same cached data serves multiple users
- Each user gets accurate "over me" filtering based on their exact GPS
- Client-side filtering is lightweight
- Users can adjust their radius without new server requests

### 3. Measurements

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Grid cell | 0.2° ≈ 22km | Grouping users for cache |
| Fetch radius | 25km | API bounding box |
| User view | 10km (adjustable) | What user sees |
| Cache TTL | 30 seconds | When to refresh data |

### 4. Why 25km Fetch Radius?

```
Grid cell = 0.2° ≈ 22km
Max user distance from grid center = 15.7km (corner diagonal)
User view radius = 10km
Total needed = 15.7 + 10 = 25.7km ≈ 25km
```

---

## Data Flow (Step by Step)

### 1. User Opens Website
Browser requests location permission.

### 2. Browser Gets GPS
```javascript
navigator.geolocation.getCurrentPosition(success, error);
// Returns: { latitude: 48.8566, longitude: 2.3522 }
```

### 3. Client Sends to Server
```
POST /api/planes
{ "lat": 48.8566, "lon": 2.3522 }
```

### 4. Server Validates Input
- Check lat is between -90 and 90
- Check lon is between -180 and 180

### 5. Server Checks Rate Limits
- Max 5 requests per 30 seconds per IP
- Max 3 unique locations per IP

### 6. Server Rounds to Grid
```
(48.8566, 2.3522) → cache key "48.8_2.4"
```

### 7. Server Checks Cache
- **Cache hit (< 30s old):** Return cached data with `nextUpdateIn`
- **Cache miss:** Continue to fetch

### 8. Server Checks Global API Limit
- Max 20 OpenSky calls per minute
- If exceeded: return stale cache or 503 error

### 9. Server Fetches from OpenSky (if needed)
```
GET /api/states/all?lamin=48.575&lamax=49.025&lomin=2.058&lomax=2.742
```

### 10. Server Caches and Returns
```json
{
  "planes": [
    { "callsign": "AFR123", "lat": 48.891, "lon": 2.412, "altitude": 2400 },
    { "callsign": "EZY456", "lat": 48.823, "lon": 2.358, "altitude": 8100 }
  ],
  "cacheAge": 0,
  "nextUpdateIn": 30
}
```

### 11. Client Filters to 10km Circle
Using Haversine formula, keep only planes within user's radius.

### 12. Client Displays on Map
Show filtered planes on Leaflet map.

### 13. Client Checks for New Planes
Compare with previously seen planes. If new plane detected:
```
🔔 "AFR123 overhead! Boeing 777 • Paris → London • 2,400m altitude"
```

### 14. Client Schedules Next Poll
```javascript
setTimeout(fetchPlanes, data.nextUpdateIn * 1000);
```

---

## Math Reference

### Constants

```
EARTH_RADIUS = 6,371 km
KM_PER_DEGREE_LAT = 111 km (constant everywhere)
KM_PER_DEGREE_LON = 111 × cos(latitude) km (varies by latitude)
```

### Why Longitude Varies

Earth is a sphere. Longitude lines converge at poles.

```
At equator (0°):    1° longitude = 111 km
At Paris (48.8°):   1° longitude = 111 × cos(48.8°) = 73 km
At Oslo (60°):      1° longitude = 111 × cos(60°) = 55.5 km
At poles (90°):     1° longitude = 0 km
```

### Converting km to Degrees

```
Δlat = distance_km / 111
Δlon = distance_km / (111 × cos(latitude))
```

### Bounding Box Calculation

```
Given center (φ, λ) and radius r km:

lat_min = φ - (r / 111)
lat_max = φ + (r / 111)
lon_min = λ - (r / (111 × cos(φ)))
lon_max = λ + (r / (111 × cos(φ)))
```

**Example: 25km around Paris (48.8°, 2.4°)**
```
Δlat = 25 / 111 = 0.225°
Δlon = 25 / (111 × cos(48.8°)) = 25 / 73 = 0.342°

lat_min = 48.8 - 0.225 = 48.575
lat_max = 48.8 + 0.225 = 49.025
lon_min = 2.4 - 0.342 = 2.058
lon_max = 2.4 + 0.342 = 2.742

API URL: ?lamin=48.575&lamax=49.025&lomin=2.058&lomax=2.742
```

### Grid Rounding

```
grid_lat = round(lat / 0.2) × 0.2
grid_lon = round(lon / 0.2) × 0.2
cache_key = "{grid_lat}_{grid_lon}"
```

**Example:**
```
User location: (48.8712, 2.3891)

grid_lat = round(48.8712 / 0.2) × 0.2 = round(244.356) × 0.2 = 244 × 0.2 = 48.8
grid_lon = round(2.3891 / 0.2) × 0.2 = round(11.9455) × 0.2 = 12 × 0.2 = 2.4

cache_key = "48.8_2.4"
```

### Haversine Formula (Distance Between Points)

```javascript
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in km
}
```

---

## Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════╗
║              METAL BIRDS OVER ME — CACHING ARCHITECTURE              ║
╚══════════════════════════════════════════════════════════════════════╝

    FETCH AREA (25km radius from center = 50km × 50km rectangle)
    ┌──────────────────────────────────────────────────────────────┐
    │                                                              │
    │   ✈ P5    ╭─────────╮                                        │
    │          ╱   ✈ P4    ╲                        ✈ P6           │
    │       ┌─│──📍 User B──│────────────────────────────────┐     │
    │       │  ╲  (48.97,  ╱   GRID CELL                     │     │
    │       │   ╰─2.28)───╯    (22km × 22km)                 │     │
    │       │      10km        ╭───────────╮                 │     │
    │       │   ✈ P3          ╱    ✈ P1    ╲                │     │
    │       │                │   📍 User A   │               │     │
    │       │                │  (48.856,     │               │     │
    │       │                │   2.352) ✈ P2 │               │     │
    │       │                 ╲      ◉      ╱                │     │
    │       │                  ╰───────────╯                 │     │
    │       │                  (48.8, 2.4)                   │     │
    │       │                     10km              ✈ P7     │     │
    │       └────────────────────────────────────────────────┘     │
    │                                                              │
    └──────────────────────────────────────────────────────────────┘

    LEGEND:
    ◉  Grid center          ───── Grid cell boundary (22km)
    📍 User                 ━━━━━ Fetch area boundary (50km)
    ✈  Airplane             ╭───╮ User's 10km view circle

    WHAT EACH USER SEES:
    Server fetches:  P1, P2, P3, P4, P5, P6, P7 (all 7)
    User A sees:     P1, P2 (within their 10km)
    User B sees:     P3, P4 (within their 10km)
    Filtered out:    P5, P6, P7 (outside both users' circles)
```

---

## Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | HTML/CSS/JavaScript | Vanilla JS, no framework |
| Map | Leaflet.js | Free, lightweight |
| Backend | Node.js + Express | Simple API server |
| Flight Data | OpenSky Network API | Free tier, requires account |
| Notifications | Browser Notifications API | Built-in |
| Hosting (Frontend) | GitHub Pages | Free |
| Hosting (Backend) | Railway / Render / Fly.io | Free tier |

---

## OpenSky API

### Rate Limits

| Tier | Calls/Day | Resolution |
|------|-----------|------------|
| Anonymous | 100 | 10 seconds |
| Registered | 4,000 | 5 seconds |
| Contributor | 8,000 | 5 seconds |

### API Endpoint

```
GET https://opensky-network.org/api/states/all?lamin={lat_min}&lamax={lat_max}&lomin={lon_min}&lomax={lon_max}
```

### Response Format

```json
{
  "time": 1706185200,
  "states": [
    [
      "icao24",       // 0: Unique aircraft identifier
      "callsign",     // 1: Flight callsign (e.g., "AFR123")
      "country",      // 2: Origin country
      "time_pos",     // 3: Timestamp of last position
      "last_contact", // 4: Timestamp of last contact
      "longitude",    // 5: Longitude in degrees
      "latitude",     // 6: Latitude in degrees
      "baro_altitude",// 7: Barometric altitude in meters
      "on_ground",    // 8: Is aircraft on ground (boolean)
      "velocity",     // 9: Ground speed in m/s
      "true_track",   // 10: Heading in degrees (0=North, 90=East)
      "vertical_rate",// 11: Climb/descent rate in m/s
      "sensors",      // 12: Sensor IDs
      "geo_altitude", // 13: Geometric altitude in meters
      "squawk",       // 14: Transponder code
      "spi",          // 15: Special position indicator
      "position_source" // 16: Source of position (0=ADS-B, 1=ASTERIX, 2=MLAT)
    ]
  ]
}
```

---

## Client-Side Storage

```javascript
// What the browser stores (localStorage + memory)

// localStorage (persists across sessions)
{
  viewRadius: 10,           // User's preferred radius (5-20km)
  soundEnabled: true,       // Notification sound preference
}

// Memory (current session only)
{
  myLocation: { lat: 48.8566, lon: 2.3522 },  // From GPS
  notifiedPlanes: ["AFR123", "EZY456"],       // Already notified
  currentPlanes: [...],                        // Currently visible
}
```

---

## MVP Features

1. **Map with user location** — Leaflet map centered on user's GPS
2. **10km radius circle** — Visual indicator of viewing area
3. **Live plane markers** — Planes displayed on map with icons
4. **Click plane for details** — Popup with callsign, altitude, speed, heading
5. **Browser notifications** — Alert when new plane enters radius
6. **Adjustable radius** — Slider to change from 5km to 20km

## Nice-to-Have Features

- Flight history log (planes that flew over today)
- Altitude filter (only show planes below X meters)
- Sound toggle for notifications
- Different plane icons based on altitude/type
- Share a spotted plane on social media

---

## File Structure

```
metal-birds-over-me/
├── frontend/
│   ├── index.html          # Main HTML page
│   ├── styles.css          # Styling
│   └── js/
│       ├── app.js          # Main application logic
│       ├── map.js          # Leaflet map handling
│       ├── api.js          # Backend communication
│       ├── notifications.js # Browser notifications
│       └── utils.js        # Haversine, helpers
├── backend/
│   ├── package.json        # Dependencies
│   ├── server.js           # Express server
│   ├── routes/
│   │   └── planes.js       # /api/planes endpoint
│   ├── services/
│   │   ├── cache.js        # Caching logic
│   │   ├── opensky.js      # OpenSky API client
│   │   └── grid.js         # Grid calculations
│   └── middleware/
│       ├── rateLimit.js    # Rate limiting
│       └── validate.js     # Input validation
├── PLAN.md                 # This file
└── README.md               # Project readme
```

---

## Configuration Values

```javascript
// Backend config
const CONFIG = {
  // Cache
  CACHE_TTL_SECONDS: 30,

  // Grid
  GRID_SIZE_DEGREES: 0.2,           // ~22km
  FETCH_RADIUS_KM: 25,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 30000,      // 30 seconds
  RATE_LIMIT_MAX_REQUESTS: 5,       // per window
  MAX_LOCATIONS_PER_IP: 3,

  // Global API protection
  MAX_API_CALLS_PER_MINUTE: 20,

  // OpenSky
  OPENSKY_BASE_URL: 'https://opensky-network.org/api',
};
```

---

## Next Steps

1. [ ] Create OpenSky Network account
2. [ ] Set up backend project (Node.js + Express)
3. [ ] Implement caching with grid logic
4. [ ] Add rate limiting and security middleware
5. [ ] Create OpenSky API client
6. [ ] Create frontend with Leaflet map
7. [ ] Implement geolocation
8. [ ] Connect frontend to backend
9. [ ] Add browser notifications
10. [ ] Implement radius adjustment slider
11. [ ] Test with real data
12. [ ] Deploy backend (Railway/Render)
13. [ ] Deploy frontend (GitHub Pages)
14. [ ] Write dev.to submission post
15. [ ] Record demo video

---

## Summary Table

| Aspect | Decision |
|--------|----------|
| Architecture | Backend proxy with regional cache |
| Communication | Smart polling (server tells when to poll) |
| User management | None (anonymous, stateless) |
| Caching | Grid-based (0.2° ≈ 22km cells) |
| Fetch area | 25km radius rectangle |
| User view | 10km radius circle (adjustable) |
| Cache TTL | 30 seconds |
| Rate limit | 5 requests per 30s per IP |
| Location limit | 3 unique locations per IP |
| Global API limit | 20 OpenSky calls per minute |
