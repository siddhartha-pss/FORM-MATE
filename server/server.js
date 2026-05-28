// server/server.js — updated startup section

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const connectDB  = require('./config/db');
const { waitForCompreface } = require('./services/comprefaceHealthService'); // ← ADD

const app = express();

// ── Middleware ──
app.use(cors({ origin: 'http://localhost:3000', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ──
app.use('/api/health',      require('./routes/healthRoutes'));
app.use('/api/users',       require('./routes/userRoutes'));
app.use('/api/onboarding',  require('./routes/onboardingRoutes'));
app.use('/api/accounts',    require('./routes/accountRoutes'));
app.use('/api/forms',       require('./routes/formRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/face',        require('./routes/faceRoutes'));
app.use('/api/stt',         require('./routes/sttRoutes'));
app.use('/api/ocr',         require('./routes/ocrRoutes'));

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: err.message });
});

// ── Startup sequence ──
// Order matters:
//   1. Connect MongoDB first (fast)
//   2. Wait for CompreFace (slow — Docker needs time)
//   3. Start Express listener last
const startServer = async () => {
  // 1. MongoDB
  await connectDB();

  // 2. CompreFace — wait but don't block if unavailable
  await waitForCompreface();

  // 3. Express
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n[SmartBank] ✅ Server running on port ${PORT}`);
    console.log(`[SmartBank]    Frontend : http://localhost:3000`);
    console.log(`[SmartBank]    Backend  : http://localhost:${PORT}`);
    console.log(`[SmartBank]    CompreFace: ${process.env.COMPREFACE_URL}\n`);
  });
};

startServer();