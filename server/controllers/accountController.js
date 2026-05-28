// server/controllers/accountController.js
// ─────────────────────────────────────────────────────────────
// getAccountsByUser:
//   Fetches all accounts linked to a userId.
//   Returns only active accounts.
//   Ordered by accountType so savings comes before current.
// ─────────────────────────────────────────────────────────────

const Account = require('../models/Account');

// ── getAccountsByUser ─────────────────────────────────────────
// GET /api/accounts/user/:userId
const getAccountsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all active accounts for this user
    // Sort by accountType for consistent ordering in the UI
    const accounts = await Account.find({
      userId: userId,
      status: 'active',
    }).sort({ accountType: 1 });

    // Return empty array (not 404) if user has no accounts —
    // frontend handles empty state with a message
    return res.status(200).json({
      success: true,
      count:   accounts.length,
      data:    accounts.map((acc) => ({
        _id:           acc._id,
        accountNumber: acc.accountNumber,
        accountType:   acc.accountType,
        branch:        acc.branch,
        ifsc:          acc.ifsc,
        status:        acc.status,
      })),
    });

  } catch (error) {
    console.error('getAccountsByUser error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching accounts.',
    });
  }
};

module.exports = { getAccountsByUser };