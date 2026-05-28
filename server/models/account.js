// server/models/Account.js
// Updated for Phase 3:
//   + balance → account balance in INR

const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },

    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },

    accountType: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['savings', 'current', 'fd', 'loan'],
        message: 'Invalid account type',
      },
      lowercase: true,
    },

    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },

    ifsc: {
      type: String,
      required: [true, 'IFSC is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format'],
    },

    // ── Balance (new in Phase 3) ──
    // Stored in paise (integer) to avoid floating point errors
    // Example: ₹25,000.50 → stored as 2500050
    // Displayed on frontend as: (balance / 100).toFixed(2)
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'frozen'],
      default: 'active',
    },

    transactions: {
      type: [
        {
          type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
          amount: { type: Number, required: true, min: 0 },
          date: { type: String, default: '' },
          accountNumber: { type: String, default: '' },
          balanceAfter: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

accountSchema.index({ userId: 1 });

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;