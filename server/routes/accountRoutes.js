// server/routes/accountRoutes.js
// ─────────────────────────────────────────────────────────────
// GET /api/accounts/user/:userId
//   → Returns all accounts belonging to a specific user
//   → Used when user lands on Account Selection screen
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { getAccountsByUser } = require('../controllers/accountController');

// GET /api/accounts/user/:userId
router.get('/user/:userId', getAccountsByUser);

module.exports = router;