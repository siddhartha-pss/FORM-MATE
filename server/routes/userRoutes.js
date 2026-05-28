// server/routes/userRoutes.js
// ─────────────────────────────────────────────────────────────
// User-related routes.
//
// POST /api/users/identify
//   → Find a user by account number OR phone number
//   → This is the entry point for the "Existing User" flow
//
// POST /api/users/register
//   → Create a user record from onboarding payloads
//
// GET /api/users/:id
//   → Fetch full user profile by MongoDB _id
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const {
  identifyUser,
  registerUser,
  getUserById,
  getRecentUsers,
} = require('../controllers/userController');

router.post('/identify', identifyUser);
router.post('/register', registerUser);
router.get('/recent', getRecentUsers);
router.get('/:id', getUserById);

module.exports = router;