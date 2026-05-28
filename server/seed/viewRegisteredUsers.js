// server/seed/viewRegisteredUsers.js
// ─────────────────────────────────────────────────────────────
// View all NEWLY REGISTERED users (not seed data).
// These are real users who completed onboarding registration.
//
// HOW TO RUN:
//   node seed/viewRegisteredUsers.js
//   node seed/viewRegisteredUsers.js --recent 5    (show last 5)
//   node seed/viewRegisteredUsers.js --export     (export to JSON)
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const fs = require('fs');

const args = process.argv.slice(2);
const limit = args.includes('--recent') 
  ? parseInt(args[args.indexOf('--recent') + 1]) 
  : 100;
const exportFlag = args.includes('--export');

async function viewRegisteredUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbank');
    console.log('\n✅ Connected to MongoDB\n');

    // Fetch users sorted by creation date (newest first)
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (users.length === 0) {
      console.log('ℹ️  No registered users found in database.\n');
      process.exit(0);
    }

    console.log(`📋 REGISTERED USERS (${users.length} total)\n`);
    console.log('═'.repeat(120));

    users.forEach((user, index) => {
      const createdDate = new Date(user.createdAt).toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Kolkata',
      });

      console.log(`\n${index + 1}. ${user.name}`);
      console.log('─'.repeat(120));
      console.log(`   ID              : ${user._id}`);
      console.log(`   Phone           : ${user.phone || 'N/A'}`);
      console.log(`   Email           : ${user.email || 'N/A'}`);
      console.log(`   DOB             : ${user.dob ? new Date(user.dob).toLocaleDateString('en-IN') : 'N/A'}`);
      console.log(`   Gender          : ${user.gender || 'N/A'}`);
      console.log(`   Aadhaar         : ${user.aadhaar || 'N/A'}`);
      console.log(`   PAN             : ${user.pan || 'N/A'}`);
      console.log(`   Address         : ${user.address?.line1 || 'N/A'}`);
      console.log(`                     ${user.address?.city}, ${user.address?.state} ${user.address?.pincode}`);
      console.log(`   KYC Status      : ${user.kycStatus}`);
      console.log(`   Face Registered : ${user.faceRegistered ? '✅ Yes' : '❌ No'}`);
      console.log(`   Registered On   : ${createdDate}`);
    });

    console.log('\n' + '═'.repeat(120) + '\n');

    // Export to JSON if requested
    if (exportFlag) {
      const filename = `registered_users_${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(filename, JSON.stringify(users, null, 2));
      console.log(`✅ Exported to: ${filename}\n`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewRegisteredUsers();
