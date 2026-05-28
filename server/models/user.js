// server/models/User.js
// ─────────────────────────────────────────────────────────────
// User model that supports both the current onboarding flow and
// the simplified registration payloads you want to test.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    line1:   { type: String, trim: true, default: '' },
    line2:   { type: String, trim: true, default: '' },
    city:    { type: String, trim: true, default: '' },
    state:   { type: String, trim: true, default: '' },
    pincode: {
      type: String,
      trim: true,
      default: '',
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },

    fullName: {
      type: String,
      trim: true,
      default: '',
    },

    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      match: [/^\d{10}$/, 'Phone must be 10 digits'],
      default: null,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },

    dob: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },

    aadhaar: {
      type: String,
      trim: true,
      sparse: true,
      match: [/^\d{12}$/, 'Aadhaar must be 12 digits'],
      default: '',
    },

    aadhaarNumber: {
      type: String,
      trim: true,
      sparse: true,
      match: [/^\d{12}$/, 'Aadhaar must be 12 digits'],
      default: '',
    },

    pan: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
      default: '',
    },

    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
      default: '',
    },

    address: {
      type: addressSchema,
      default: () => ({}),
    },

    accountType: {
      type: String,
      trim: true,
      default: '',
    },

    faceSubjectName: {
      type: String,
      trim: true,
      default: '',
    },

    faceRegistered: {
      type: Boolean,
      default: false,
    },

    comprefaceSubjectId: {
      type: String,
      trim: true,
      default: '',
    },

    kycStatus: {
      type: String,
      enum: ['complete', 'partial', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ faceSubjectName: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;