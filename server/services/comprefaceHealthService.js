// server/services/comprefaceHealthService.js
// ─────────────────────────────────────────────────────────────
// Verifies that CompreFace is running and responsive
// before the Express server starts accepting face recognition
// requests.
//
// Called once at startup from server.js.
// Also called by the /api/face/health route so the frontend
// can check CompreFace status before showing the scan button.
// ─────────────────────────────────────────────────────────────

const axios = require('axios');

// How many times to retry before giving up
const MAX_RETRIES    = 10;
// How long to wait between retries (milliseconds)
const RETRY_DELAY_MS = 3000;
// How long to wait for each health check response
const TIMEOUT_MS     = 5000;

// ── sleep helper ──
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── checkComprefaceHealth ──
// Single health check — returns true if CompreFace is up
const checkComprefaceHealth = async () => {
  try {
    const url = `${process.env.COMPREFACE_URL}/actuator/health`;
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    return response.status === 200;
  } catch {
    return false;
  }
};

// ── waitForCompreface ──
// Retries health check until CompreFace is ready or retries exhausted.
// Called once at server startup.
const waitForCompreface = async () => {
  console.log('[CompreFace] Waiting for CompreFace to be ready...');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const isReady = await checkComprefaceHealth();

    if (isReady) {
      console.log(`[CompreFace] ✅ Ready after ${attempt} attempt(s).`);
      return true;
    }

    console.log(
      `[CompreFace] Not ready yet — attempt ${attempt}/${MAX_RETRIES}. ` +
      `Retrying in ${RETRY_DELAY_MS / 1000}s...`
    );

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  // CompreFace never became available — warn but don't crash
  console.warn(
    '[CompreFace] ⚠️  Could not reach CompreFace after all retries.\n' +
    '             Face recognition will fail until CompreFace is available.\n' +
    '             Manual fallback (account number) will still work.'
  );
  return false;
};

// ── getComprefaceStatus ──
// Quick single check — used by the health route
const getComprefaceStatus = async () => {
  const isReady = await checkComprefaceHealth();
  return {
    available: isReady,
    url:       process.env.COMPREFACE_URL,
    message:   isReady
      ? 'CompreFace is running and available.'
      : 'CompreFace is not reachable. Use account number fallback.',
  };
};

module.exports = { waitForCompreface, getComprefaceStatus };