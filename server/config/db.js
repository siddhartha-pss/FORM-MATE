// server/config/db.js
// ─────────────────────────────────────────────────────────────
// MongoDB connection using Mongoose.
//
// What this file does:
//   - Reads MONGO_URI from .env
//   - Connects Mongoose to MongoDB
//   - Logs success or failure clearly
//   - Sets up connection event listeners for debugging
//
// Called once at server startup from server.js.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise — we await it
    const connection = await mongoose.connect(process.env.MONGO_URI);

    // connection.connection.host tells us which MongoDB server we connected to
    console.log(`MongoDB connected: ${connection.connection.host}`);
    console.log(`Database name: ${connection.connection.name}`);

  } catch (error) {
    // If connection fails, log the reason clearly and stop the process
    // There is no point running the server without a database
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);   // exit code 1 = failure
  }
};

// ── Connection event listeners ──
// These fire AFTER the initial connection is made.
// Useful for catching disconnections during runtime.

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully.');
});

module.exports = connectDB;