// server/controllers/userController.js
// ─────────────────────────────────────────────────────────────
// Handles all user-related logic.
//
// identifyUser:
//   The most important function in the backend.
//   This is how the system recognises who is at the kiosk.
//   Accepts accountNumber OR phone number.
//   Returns the user's profile + all their linked accounts.
//   In Phase 4, face recognition will call this same logic
//   after matching the face to a userId.
//
// getUserById:
//   Simple profile fetch by MongoDB _id.
//
// registerUser:
//   Compatibility helper for onboarding and the simpler user
//   payloads you want to test. It accepts both the current
//   onboarding shape and the reduced fields from your snippet.
// ─────────────────────────────────────────────────────────────

const User    = require('../models/user');
const Account = require('../models/Account');

const normaliseAddress = (address) => {
  if (!address) {
    return {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    };
  }

  if (typeof address === 'string') {
    return {
      line1: address,
      line2: '',
      city: '',
      state: '',
      pincode: '',
    };
  }

  return {
    line1: address.line1 || '',
    line2: address.line2 || '',
    city: address.city || '',
    state: address.state || '',
    pincode: address.pincode || '',
  };
};

const normalizeAccountType = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  const map = {
    'savings account': 'savings',
    'current account': 'current',
    'salary account': 'savings',
    'joint account': 'savings',
    'fixed deposit': 'fd',
    'fixed deposit account': 'fd',
    'loan account': 'loan',
    savings: 'savings',
    current: 'current',
    salary: 'savings',
    joint: 'savings',
    fd: 'fd',
    loan: 'loan',
  };

  return map[normalized] || 'savings';
};

const generateAccountNumber = (type) => {
  const prefix = type === 'current' ? 'CA' : type === 'fd' ? 'FD' : 'SA';
  const randomPart = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}${randomPart}`;
};

const resolveUserPayload = (body = {}) => {
  const name = body.name || body.fullName || '';
  const phone = body.phone || '';
  const email = body.email || '';
  const dob = body.dob ? new Date(body.dob) : null;
  const gender = body.gender || '';
  const aadhaar = body.aadhaar || body.aadhaarNumber || '';
  const pan = (body.pan || body.panNumber || '').toUpperCase();
  const address = normaliseAddress(body.address);
  const accountType = normalizeAccountType(body.accountType || '');
  const fullName = body.fullName || name;

  if (dob && Number.isNaN(dob.getTime())) {
    throw new Error('Invalid DOB format.');
  }

  const hasAadhaar = Boolean(aadhaar);
  const hasPan = Boolean(pan);

  return {
    name,
    fullName,
    phone,
    email,
    dob,
    gender,
    aadhaar,
    pan,
    aadhaarNumber: aadhaar,
    panNumber: pan,
    address,
    accountType,
    faceRegistered: Boolean(body.faceRegistered),
    comprefaceSubjectId: body.comprefaceSubjectId || '',
    kycStatus: hasAadhaar && hasPan
      ? 'complete'
      : hasAadhaar || hasPan
        ? 'partial'
        : 'pending',
  };
};

// ── identifyUser ──────────────────────────────────────────────
// POST /api/users/identify
// Body: { accountNumber } OR { phone }
const identifyUser = async (req, res) => {
  try {
    const { accountNumber, phone } = req.body;

    if (!accountNumber && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an account number or phone number.',
      });
    }

    let user = null;

    if (accountNumber) {
      const account = await Account.findOne({
        accountNumber: accountNumber.trim().toUpperCase(),
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this account number.',
        });
      }

      user = await User.findById(account.userId);
    }

    if (!user && phone) {
      user = await User.findOne({ phone: phone.trim() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with the provided details.',
      });
    }

    const accounts = await Account.find({
      userId: user._id,
      status: 'active',
    });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id:     user._id,
          name:    user.name,
          phone:   user.phone,
          email:   user.email,
          dob:     user.dob,
          gender:  user.gender,
          address: user.address,
        },
        accounts: accounts.map((acc) => ({
          _id:           acc._id,
          accountNumber: acc.accountNumber,
          accountType:   acc.accountType,
          branch:        acc.branch,
          ifsc:          acc.ifsc,
          status:        acc.status,
        })),
      },
    });

  } catch (error) {
    console.error('identifyUser error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while identifying user.',
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const payload = resolveUserPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.',
      });
    }

    const subjectName = payload.comprefaceSubjectId || payload.fullName || payload.name;

    const user = new User({
      name: payload.name,
      phone: payload.phone || undefined,
      email: payload.email,
      dob: payload.dob,
      gender: payload.gender,
      aadhaar: payload.aadhaar,
      pan: payload.pan,
      address: payload.address,
      faceSubjectName: subjectName || '',
      faceRegistered: payload.faceRegistered,
      comprefaceSubjectId: subjectName || undefined,
      kycStatus: payload.kycStatus,
      fullName: payload.fullName,
      aadhaarNumber: payload.aadhaarNumber,
      panNumber: payload.panNumber,
      accountType: payload.accountType,
    });

    await user.save();

    const account = await Account.create({
      userId: user._id,
      accountNumber: generateAccountNumber(payload.accountType),
      accountType: payload.accountType,
      branch: 'Main Branch',
      ifsc: payload.accountType === 'fd' ? 'FDIN0000001' : 'SBIN0000001',
      balance: 0,
      status: 'active',
    });

    return res.status(201).json({
      success: true,
      userId: user._id,
      subjectName: user.comprefaceSubjectId || user.faceSubjectName || user.fullName || user.name,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        dob: user.dob,
        gender: user.gender,
        aadhaar: user.aadhaar,
        pan: user.pan,
        address: user.address,
        faceRegistered: user.faceRegistered,
        comprefaceSubjectId: user.comprefaceSubjectId,
        kycStatus: user.kycStatus,
      },
      account: {
        _id: account._id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        branch: account.branch,
        ifsc: account.ifsc,
        status: account.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this Aadhaar or PAN already exists.',
      });
    }

    console.error('registerUser error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id:     user._id,
        name:    user.name,
        phone:   user.phone,
        email:   user.email,
        dob:     user.dob,
        gender:  user.gender,
        address: user.address,
      },
    });

  } catch (error) {
    console.error('getUserById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user.',
    });
  }
};

const getRecentUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id name phone email dob gender aadhaar pan address faceRegistered kycStatus createdAt');

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users.map((user) => ({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        dob: user.dob,
        gender: user.gender,
        aadhaar: user.aadhaar,
        pan: user.pan,
        address: user.address,
        faceRegistered: user.faceRegistered,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
      })),
    });

  } catch (error) {
    console.error('getRecentUsers error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching recent users.',
    });
  }
};

module.exports = { identifyUser, registerUser, getUserById, getRecentUsers };