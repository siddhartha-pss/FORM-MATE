// server/controllers/formController.js
// ─────────────────────────────────────────────────────────────
// The form engine lives here.
//
// fillForm is the core function:
//   1. Receives { formId, userId, accountId }
//   2. Fetches the form template from MongoDB
//   3. Fetches user and account documents
//   4. Resolves each field's dataSource against real data
//   5. Returns fully resolved field list to the frontend
//
// resolveDataSource is the helper that does the dot-path lookup:
//   "user.name"            → user["name"]
//   "user.address.city"    → user["address"]["city"]
//   "account.accountNumber"→ account["accountNumber"]
// ─────────────────────────────────────────────────────────────

const FormTemplate = require('../models/formTemplate');
const User         = require('../models/user');
const Account      = require('../models/Account');

// ── Helper: resolve a dot-path string into a value ───────────
// Example:
//   resolveDataSource("user.address.city", { user, account })
//   → "Vijayawada"
//
// Returns null if the path doesn't resolve to a value.
const resolveDataSource = (dataSource, sources) => {
  if (!dataSource) return null;

  const parts = dataSource.split('.');
  const sourceName = parts[0];

  if (sourceName === 'system') {
    if (parts[1] === 'currentDate') {
      return new Date().toISOString().split('T')[0];
    }
    return null;
  }

  const source = sources[sourceName];

  if (!source) return null;

  // Walk the remaining path into the object
  // parts.slice(1) = ["address", "city"]
  const value = parts.slice(1).reduce((obj, key) => {
    return obj && obj[key] !== undefined ? obj[key] : null;
  }, source);

  // Special handling for address object —
  // if dataSource is "user.address", format it as a readable string
  if (typeof value === 'object' && value !== null) {
    // Join non-empty address parts into one readable string
    const addressParts = [
      value.line1,
      value.line2,
      value.city,
      value.state,
      value.pincode,
    ].filter(Boolean);    // remove empty strings

    return addressParts.join(', ');
  }

  // For Date objects, return as a formatted date string
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];  // "YYYY-MM-DD"
  }

  return value ? String(value) : null;
};

// ── getAllForms ───────────────────────────────────────────────
// GET /api/forms
// Optional query: ?accountType=savings
const getAllForms = async (req, res) => {
  try {
    const { accountType } = req.query;

    // Build filter — if accountType is provided, only return
    // forms applicable for that account type
    let filter = {};
    if (accountType) {
      filter = {
        $or: [
          { applicableFor: accountType },
          { applicableFor: { $size: 0 } },  // empty array = all types
        ],
      };
    }

    // Return only summary info — not the full fields array
    // The fields array is fetched separately when user selects a form
    const forms = await FormTemplate.find(filter, {
      formId:      1,
      formName:    1,
      description: 1,
      keywords:    1,
      applicableFor: 1,
    });

    return res.status(200).json({
      success: true,
      count:   forms.length,
      data:    forms,
    });

  } catch (error) {
    console.error('getAllForms error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching forms.',
    });
  }
};

// ── getFormById ───────────────────────────────────────────────
// GET /api/forms/:formId
const getFormById = async (req, res) => {
  try {
    const form = await FormTemplate.findOne({
      formId: req.params.formId.toLowerCase(),
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: `Form template '${req.params.formId}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data:    form,
    });

  } catch (error) {
    console.error('getFormById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching form template.',
    });
  }
};

// ── fillForm ──────────────────────────────────────────────────
// POST /api/forms/fill
// Body: { formId, userId, accountId }
//
// This is the form engine.
// It returns the form template with every autoFill field
// already resolved to the user's real data.
const fillForm = async (req, res) => {
  try {
    const { formId, userId, accountId } = req.body;

    // Validate required fields
    if (!formId || !userId || !accountId) {
      return res.status(400).json({
        success: false,
        message: 'formId, userId, and accountId are all required.',
      });
    }

    // ── Fetch all three documents in parallel ──
    // Promise.all runs all three queries at the same time
    // instead of waiting for each one to finish before starting the next
    const [form, user, account] = await Promise.all([
      FormTemplate.findOne({ formId: formId.toLowerCase() }),
      User.findById(userId),
      Account.findById(accountId),
    ]);

    // Validate each document exists
    if (!form) {
      return res.status(404).json({
        success: false,
        message: `Form template '${formId}' not found.`,
      });
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    // Verify this account actually belongs to this user
    if (account.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This account does not belong to the identified user.',
      });
    }

    // ── Build the sources object ──
    // resolveDataSource will look up paths against this
    const sources = {
      user:    user.toObject(),     // convert Mongoose doc to plain JS object
      account: account.toObject(),
    };

    // ── Resolve each field ──
    const resolvedFields = form.fields.map((field) => {

      // Signature fields are NEVER auto-filled — always blank
      if (field.type === 'signature') {
        return {
          fieldId:    field.fieldId,
          label:      field.label,
          type:       field.type,
          value:      null,
          autoFilled: false,
          required:   field.required,
          options:    field.options,
          placeholder: field.placeholder,
        };
      }

      // Resolve the dataSource to a real value
      const resolvedValue = field.autoFill
        ? resolveDataSource(field.dataSource, sources)
        : null;

      return {
        fieldId:     field.fieldId,
        label:       field.label,
        type:        field.type,
        value:       resolvedValue,         // actual data or null
        autoFilled:  resolvedValue !== null, // true only if value was found
        required:    field.required,
        options:     field.options,
        placeholder: field.placeholder,
      };
    });

    // ── Send the filled form back ──
    return res.status(200).json({
      success: true,
      data: {
        formId:   form.formId,
        formName: form.formName,
        fields:   resolvedFields,
      },
    });

  } catch (error) {
    console.error('fillForm error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while filling form.',
    });
  }
};

module.exports = { getAllForms, getFormById, fillForm };