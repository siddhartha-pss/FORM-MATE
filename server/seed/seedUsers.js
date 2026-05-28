// server/seed/seedUsers.js
// ─────────────────────────────────────────────────────────────
// Seeds demo users and their linked accounts into MongoDB.
//
// HOW TO RUN:
//   node seed/seedUsers.js
//
// WHAT IT DOES:
//   1. Connects to MongoDB
//   2. Clears existing users and accounts (fresh start)
//   3. Inserts 2 demo users
//   4. Inserts 3 demo accounts linked to those users
//   5. Logs confirmation and disconnects
//
// Run this ONCE before testing your API routes.
// ─────────────────────────────────────────────────────────────

require('dotenv').config();                   // load MONGO_URI from .env
const mongoose = require('mongoose');
const User     = require('../models/user');
const Account  = require('../models/Account');

// ── Demo Users ──
// These are purely for testing the kiosk system.
// faceId is empty — will be added in Phase 4.
const demoUsers = [
  {
    name:   'Ravi Kumar',
    phone:  '9876543210',
    email:  'ravi.kumar@email.com',
    dob:    new Date('1990-05-12'),
    gender: 'Male',
    aadhaar: '123456789012',
    address: {
      line1:   '12 MG Road',
      line2:   'Near City Mall',
      city:    'Vijayawada',
      state:   'Andhra Pradesh',
      pincode: '520001',
    },
    faceId: '',   // populated in Phase 4
  },
  {
    name:   'Priya Sharma',
    phone:  '9845012345',
    email:  'priya.sharma@email.com',
    dob:    new Date('1995-11-22'),
    gender: 'Female',
    aadhaar: '987654321098',
    address: {
      line1:   '45 Gandhi Nagar',
      line2:   '',
      city:    'Hyderabad',
      state:   'Telangana',
      pincode: '500001',
    },
    faceId: '',
  },
];

const seedUsers = async () => {
  try {
    // ── Connect to MongoDB ──
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // ── Clear existing data ──
    // Start fresh every time this script runs
    await User.deleteMany({});
    await Account.deleteMany({});
    console.log('Cleared existing users and accounts.');

    // ── Insert Users ──
    // insertMany returns the created documents with their _id fields
    const createdUsers = await User.insertMany(demoUsers);
    console.log(`Inserted ${createdUsers.length} users.`);

    // Pull out the _id values for linking accounts
    const raviId  = createdUsers[0]._id;
    const priyaId = createdUsers[1]._id;

    // ── Demo Accounts ──
    // Each account references a userId from the users we just created
    const demoAccounts = [
      {
        userId:        raviId,
        accountNumber: 'SB00100001',
        accountType:   'savings',
        branch:        'Vijayawada Main Branch',
        ifsc:          'SBIN0001234',
        status:        'active',
      },
      {
        userId:        raviId,
        accountNumber: 'CA00100002',
        accountType:   'current',
        branch:        'Vijayawada Main Branch',
        ifsc:          'SBIN0001234',
        status:        'active',
      },
      {
        userId:        priyaId,
        accountNumber: 'SB00100003',
        accountType:   'savings',
        branch:        'Hyderabad Central Branch',
        ifsc:          'SBIN0005678',
        status:        'active',
      },
    ];

    // ── Insert Accounts ──
    const createdAccounts = await Account.insertMany(demoAccounts);
    console.log(`Inserted ${createdAccounts.length} accounts.`);

    // ── Summary ──
    console.log('\n── Seed Summary ──────────────────────────');
    createdUsers.forEach((user) => {
      console.log(`User: ${user.name} | Phone: ${user.phone} | ID: ${user._id}`);
    });
    console.log('');
    createdAccounts.forEach((acc) => {
      console.log(`Account: ${acc.accountNumber} | Type: ${acc.accountType} | UserId: ${acc.userId}`);
    });
    console.log('──────────────────────────────────────────\n');

  } catch (error) {
    console.error('Seeding users failed:', error.message);
  } finally {
    // Always disconnect after seeding — whether it succeeded or failed
    await mongoose.disconnect();
    console.log('MongoDB disconnected. Seeding complete.');
  }
};

// Run the function
seedUsers();