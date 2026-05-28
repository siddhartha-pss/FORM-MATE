// server/routes/submissionRoutes.js
// ─────────────────────────────────────────────────────────────
// POST /api/submissions
//   → Save a completed form submission
//
// GET  /api/submissions/user/:userId
//   → Get all past submissions by a user
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const {
  submitForm,
  getSubmissionsByUser,
} = require('../controllers/submissionController');

// POST /api/submissions
router.post('/', submitForm);

// GET /api/submissions/user/:userId
router.get('/user/:userId', getSubmissionsByUser);

module.exports = router;