// server/routes/sttRoutes.js
// ─────────────────────────────────────────────────────────────
// POST /api/stt/transcribe
//   → Receives audio blob from React frontend
//   → Sends to AssemblyAI for transcription
//   → Returns transcript text
//
// This route exists as a fallback when Chrome's built-in
// Web Speech API is blocked by the network.
// ─────────────────────────────────────────────────────────────

const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { transcribeAudio } = require('../controllers/sttController');

// Use memory storage — audio blob stays in RAM
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },   // 10MB max
});

// POST /api/stt/transcribe
router.post('/transcribe', upload.single('audio'), transcribeAudio);

module.exports = router;