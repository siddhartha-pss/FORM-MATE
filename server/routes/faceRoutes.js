// server/routes/faceRoutes.js
// ─────────────────────────────────────────────────────────────
// POST /api/face/recognize
//   → Receives image from React frontend
//   → multer processes the file upload
//   → faceController.recognizeAndFetch handles the logic
//
// multer configuration:
//   storage: memoryStorage() → image stored in RAM as Buffer
//   No disk writes — the Buffer is sent directly to CompreFace.
//   This is faster and cleaner for a kiosk with no persistent storage.
//
//   limits.fileSize: 5MB max — prevents huge image uploads
//   fileFilter: only accept image/* types
// ─────────────────────────────────────────────────────────────

const express  = require('express');
const multer   = require('multer');
const router   = express.Router();
const { recognizeAndFetch, registerFacesForUser } = require('../controllers/faceController');
const { getComprefaceStatus } = require('../services/comprefaceHealthService');

// ── Multer configuration ──
const storage = multer.memoryStorage();
// memoryStorage keeps the file in req.file.buffer (RAM)
// No temp files on disk — cleaner for a demo system

const fileFilter = (req, file, cb) => {
  // Only accept image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);    // accept file
  } else {
    cb(new Error('Only image files are accepted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,   // 5 MB max per image
  },
});

// ── Routes ──

// POST /api/face/recognize
// 'image' must match the field name used in the React FormData
router.post(
  '/recognize',
  upload.single('image'),    // multer processes one file named 'image'
  recognizeAndFetch          // then controller takes over
);

// POST /api/face/register
// JSON body: { userId, images: [base64Strings] }
router.post('/register', registerFacesForUser);

// GET /api/face/health
// Frontend polls this before showing the Scan button
// Returns whether CompreFace is currently available
router.get('/health', async (req, res) => {
  const status = await getComprefaceStatus();
  res.status(200).json({
    success: true,
    ...status,
  });
});

module.exports = router;