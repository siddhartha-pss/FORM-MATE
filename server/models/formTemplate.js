// server/models/FormTemplate.js
// ─────────────────────────────────────────────────────────────
// Form Template Schema — defines the structure of a bank form
// as a reusable template stored in MongoDB.
//
// HOW IT WORKS:
//   Each form template contains a 'fields' array.
//   Each field has a 'dataSource' string like "user.name"
//   or "account.accountNumber".
//
//   The form engine (formController.js) reads these templates,
//   resolves each dataSource against actual user/account data,
//   and returns a pre-filled form to the frontend.
//
//   Fields with dataSource: null are left empty for the user
//   to fill manually. Signature fields are NEVER auto-filled.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

// ── Field Sub-Schema ──
// Each item in the 'fields' array follows this structure.
// Defined separately to keep the main schema clean.
const fieldSchema = new mongoose.Schema(
  {
    // Unique identifier for this field within the form
    // Used to match values when form is submitted
    // Example: "applicant_name", "account_number", "num_leaves"
    fieldId: {
      type: String,
      required: [true, 'fieldId is required'],
      trim: true,
    },

    // Human-readable label shown on the form UI
    // Example: "Applicant Name", "Date of Request"
    label: {
      type: String,
      required: [true, 'label is required'],
      trim: true,
    },

    // Input type — tells the frontend how to render this field
    type: {
      type: String,
      required: [true, 'field type is required'],
      enum: {
        values: ['text', 'date', 'select', 'textarea', 'signature'],
        message: 'Field type must be text, date, select, textarea, or signature',
      },
    },

    // dataSource — the KEY field for auto-filling.
    // A dot-notation path into the user/account object.
    // Examples:
    //   "user.name"               → user document's name field
    //   "user.address.city"       → nested address.city
    //   "user.phone"              → user's phone number
    //   "account.accountNumber"   → account document's accountNumber
    //   "account.branch"          → account's branch name
    //   null                      → no auto-fill, user fills manually
    dataSource: {
      type: String,
      default: null,   // null means manual fill required
    },

    // Whether this field should be auto-filled by the system
    // true  → system fills it from dataSource
    // false → user fills it manually
    // Signature fields must ALWAYS have autoFill: false
    autoFill: {
      type: Boolean,
      default: false,
    },

    // Whether the form cannot be submitted without this field
    required: {
      type: Boolean,
      default: false,
    },

    // Dropdown options — only used when type is 'select'
    // Stored as array of strings
    // Example: ["10 Leaves", "25 Leaves", "50 Leaves"]
    options: {
      type: [String],
      default: [],
    },

    // Placeholder text shown inside empty input fields
    // Example: "Enter your remarks here"
    placeholder: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }  // fields don't need their own _id
);

// ── Main Form Template Schema ──
const formTemplateSchema = new mongoose.Schema(
  {
    // Short unique identifier — used by frontend and controllers
    // to request a specific form template
    // Example: "cheque_book_request", "address_change"
    formId: {
      type: String,
      required: [true, 'formId is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Display name shown on the Form Selection screen
    formName: {
      type: String,
      required: [true, 'formName is required'],
      trim: true,
    },

    // Short description shown on form selection cards
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Which account types can use this form.
    // A cheque book form only makes sense for savings/current.
    // An FD form only makes sense for fd accounts.
    // Empty array = available for ALL account types.
    applicableFor: {
      type: [String],
      enum: ['savings', 'current', 'fd', 'loan'],
      default: [],   // empty = no restriction
    },

    // Keywords used by the Speech-to-Text matcher (Phase 4).
    // When user says "I want a cheque book",
    // the system checks if any keyword matches the transcript.
    // Example: ["cheque", "cheque book", "chequebook"]
    keywords: {
      type: [String],
      default: [],
    },

    // The form fields — array of fieldSchema sub-documents.
    // ORDER MATTERS — fields are rendered in this order on the frontend.
    fields: {
      type: [fieldSchema],
      required: [true, 'fields array is required'],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'A form template must have at least one field',
      },
    },
  },
  {
    timestamps: true,
  }
);

// ── Model ──
// 'FormTemplate' → Mongoose uses collection 'formtemplates'
const FormTemplate = mongoose.model('FormTemplate', formTemplateSchema);

module.exports = FormTemplate;