// server/routes/formRoutes.js
// ─────────────────────────────────────────────────────────────
// GET  /api/forms
//   → List all available form templates (for Form Selection screen)
//   → Optionally filter by accountType query param
//
// GET  /api/forms/:formId
//   → Get one specific form template by formId string
//
// POST /api/forms/fill
//   → The form engine endpoint
//   → Takes { formId, userId, accountId }
//   → Returns the form with auto-filled values resolved
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const {
  getAllForms,
  getFormById,
  fillForm,
} = require('../controllers/formController');

// GET /api/forms?accountType=savings  (accountType is optional filter)
router.get('/', getAllForms);

// IMPORTANT: '/fill' route must come BEFORE '/:formId'
// Otherwise Express matches "fill" as the :formId param
router.post('/fill', fillForm);

// GET /api/forms/cheque_book_request
router.get('/:formId', getFormById);

module.exports = router;