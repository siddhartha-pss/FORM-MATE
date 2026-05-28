// server/routes/healthRoutes.js
// ─────────────────────────────────────────────────────────
// A simple health check route.
// Purpose: confirm the server is running correctly.
// Frontend or developer hits GET /api/health
// and gets back a JSON confirmation.
// ─────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();

// GET /api/health
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartBank server is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;