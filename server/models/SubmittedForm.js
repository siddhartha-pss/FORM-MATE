// server/models/SubmittedForm.js
// ─────────────────────────────────────────────────────────────
// Submitted Form Schema — stores a record every time a user
// submits a filled form at the kiosk.
//
// This acts as an audit log:
//   - Which user submitted what form
//   - Which account it was for
//   - What data they entered
//   - When it was submitted
//
// submittedData stores the form field values as a flexible
// object — we use Map type so any form can be stored
// regardless of its field structure.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const submittedFormSchema = new mongoose.Schema(
  {
    // Which user submitted this form
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },

    // Which account the form was submitted for
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'accountId is required'],
    },

    // Which form template was used
    // Stored as string (formId) rather than ObjectId ref
    // so it remains readable even if the template is later updated
    formType: {
      type: String,
      required: [true, 'formType is required'],
      trim: true,
      lowercase: true,
    },

    // The actual form data submitted by the user.
    // Stored as a flexible key-value Map.
    // Example:
    // {
    //   "applicant_name": "Ravi Kumar",
    //   "account_number": "SB001",
    //   "num_leaves":     "25 Leaves",
    //   "date":           "2026-05-07"
    // }
    // Map type allows any fields without a fixed schema —
    // different form types have different fields.
    submittedData: {
      type: Map,
      of: String,      // all values are stored as strings
      required: [true, 'submittedData is required'],
    },

    // Submission status — useful for bank staff review
    status: {
      type: String,
      enum: ['pending', 'processed', 'rejected'],
      default: 'pending',
    },
  },
  {
    // createdAt = exact time the form was submitted (submission timestamp)
    // updatedAt = when bank staff last changed the status
    timestamps: true,
  }
);

// ── Indexes for common queries ──

// "Show all submissions by this user"
submittedFormSchema.index({ userId: 1 });

// "Show all submissions for this account"
submittedFormSchema.index({ accountId: 1 });

// "Show all pending submissions" (for bank staff dashboard later)
submittedFormSchema.index({ status: 1 });

// ── Model ──
// 'SubmittedForm' → Mongoose uses collection 'submittedforms'
const SubmittedForm = mongoose.model('SubmittedForm', submittedFormSchema);

module.exports = SubmittedForm;