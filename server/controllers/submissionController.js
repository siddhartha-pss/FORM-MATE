// server/controllers/submissionController.js
// ─────────────────────────────────────────────────────────────
// submitForm:
//   Saves a filled form to the submittedforms collection.
//   This is called when user clicks Submit on the Form Fill screen.
//
// getSubmissionsByUser:
//   Returns all past form submissions for a user.
//   Useful for history / reference.
// ─────────────────────────────────────────────────────────────

const SubmittedForm = require('../models/SubmittedForm');
const Account = require('../models/Account');

// ── submitForm ────────────────────────────────────────────────
// POST /api/submissions
// Body: { userId, accountId, formType, submittedData }
const submitForm = async (req, res) => {
  try {
    const { userId, accountId, formType, submittedData } = req.body;

    // Validate required fields
    if (!userId || !accountId || !formType || !submittedData) {
      return res.status(400).json({
        success: false,
        message: 'userId, accountId, formType, and submittedData are required.',
      });
    }

    const normalizedFormType = formType.toLowerCase();

    let account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (normalizedFormType === 'deposit_form' || normalizedFormType === 'withdrawal_form') {
      const amountInRupees = Number(submittedData.amount ?? submittedData['amount']);

      if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
      }

      // Balance is stored in paise, but the form input is in rupees.
      const amountInPaise = Math.round(amountInRupees * 100);

      if (normalizedFormType === 'withdrawal_form' && account.balance < amountInPaise) {
        return res.status(400).json({ success: false, message: 'Insufficient balance for withdrawal.' });
      }

      const type = normalizedFormType === 'deposit_form' ? 'deposit' : 'withdrawal';
      const newBalance = type === 'deposit'
        ? account.balance + amountInPaise
        : account.balance - amountInPaise;

      account.balance = newBalance;
      account.transactions = account.transactions || [];
      account.transactions.unshift({
        type,
        amount: amountInPaise,
        date: new Date().toISOString().split('T')[0],
        accountNumber: account.accountNumber,
        balanceAfter: newBalance,
      });

      await account.save();
    }

    const submission = await SubmittedForm.create({
      userId,
      accountId,
      formType: normalizedFormType,
      submittedData,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Form submitted successfully.',
      data: {
        submissionId: submission._id,
        formType:     submission.formType,
        status:       submission.status,
        submittedAt:  submission.createdAt,
      },
    });

  } catch (error) {
    console.error('submitForm error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving form submission.',
    });
  }
};

// ── getSubmissionsByUser ──────────────────────────────────────
// GET /api/submissions/user/:userId
const getSubmissionsByUser = async (req, res) => {
  try {
    const submissions = await SubmittedForm
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 });  // newest first

    return res.status(200).json({
      success: true,
      count:   submissions.length,
      data:    submissions,
    });

  } catch (error) {
    console.error('getSubmissionsByUser error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions.',
    });
  }
};

module.exports = { submitForm, getSubmissionsByUser };