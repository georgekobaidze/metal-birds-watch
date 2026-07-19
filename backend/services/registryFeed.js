const { REGISTRY_FEED_BASE_URL, REGISTRY_FEED_TOKEN } = require('../config');

// Registry lookups are hex-keyed; OpenSky's icao24 is the same 6-char lowercase hex the feed expects.
const HEX_RE = /^[0-9a-f]{6}$/;
const MAX_HEXES = 500; // Feed rejects payloads above this.
const REGISTRY_FEED_TIMEOUT_MS = 4000; // Enrichment is best-effort; never let it stall the plane response.

/**
 * Look up registry details (aircraft type + upstream attribution) for a set of planes from the
 * Metal Birds Feed and attach them in place. Best-effort: any missing config, timeout, or error
 * leaves the planes untouched so the core live feed never depends on enrichment.
 * @param {Array} planes - Plane objects from OpenSky (each with an `icao24` hex)
 * @returns {Promise<Array>} The same array, each plane gaining `registry` when the feed has a match
 */
async function enrichPlanes(planes) {
  if (!REGISTRY_FEED_BASE_URL || !REGISTRY_FEED_TOKEN || !Array.isArray(planes) || planes.length === 0) {
    return planes;
  }

  const hexes = [...new Set(planes.map(p => String(p.icao24 || '').toLowerCase()).filter(h => HEX_RE.test(h)))].slice(0, MAX_HEXES);
  if (hexes.length === 0) {
    return planes;
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REGISTRY_FEED_TIMEOUT_MS);

  try {
    const response = await fetch(new URL('/feed', REGISTRY_FEED_BASE_URL).toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REGISTRY_FEED_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ hexes }),
      signal: timeoutController.signal
    });

    if (!response.ok) {
      throw new Error(`Feed API error: ${response.status} ${response.statusText}`);
    }

    // Hex-keyed map of the descriptive slice; misses are simply absent.
    const registry = await response.json();
    let matched = 0;
    for (const plane of planes) {
      const match = registry[String(plane.icao24 || '').toLowerCase()];
      if (match) {
        plane.registry = match;
        matched++;
      }
    }

    // A visible heartbeat that enrichment ran — otherwise a working call is as silent as a broken one.
    console.log(`Feed enrichment: matched ${matched}/${planes.length} planes (${hexes.length} looked up)`);

    return planes;

  } catch (error) {
    // Enrichment is optional.
    if (error.name === 'AbortError') {
      console.error(`Feed enrichment timeout after ${REGISTRY_FEED_TIMEOUT_MS}ms`);
    } else {
      console.error('Feed enrichment failed:', error.message);
    }
    return planes;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  enrichPlanes
};
