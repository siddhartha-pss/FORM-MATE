// server/seed/seedCustomers.js
// ─────────────────────────────────────────────────────────────
// Seeds all 7 CompreFace-enrolled customers with realistic,
// varied bank data into MongoDB.
//
// HOW TO RUN:
//   node seed/seedCustomers.js
//
// IMPORTANT:
//   faceSubjectName values MUST match CompreFace subjects exactly:
//   "Drashwanth", "Pavan sai", "Sai Krishna", "Sai Teja",
//   "Siddhartha", "Vidhya", "Vignesh"
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const mongoose = require('mongoose');
const User    = require('../models/user');
const Account = require('../models/Account');

// ── Customer definitions ──────────────────────────────────────
// Varied across: accounts, KYC, branches, cities, balances
const customers = [

  // ── 1. Drashwanth ──
  // Full KYC | Vijayawada | Savings + Current
  {
    user: {
      name:            'Drashwanth Dadi',
      phone:           '9849012345',
      email:           'drashwanth.reddy@gmail.com',
      dob:             new Date('1998-03-15'),
      gender:          'Male',
      aadhaar:         '234567890123',
      pan:             'DRDYP1234A',
      address: {
        line1:   '42 Benz Circle',
        line2:   'Near RTC Complex',
        city:    'Vijayawada',
        state:   'Andhra Pradesh',
        pincode: '520001',
      },
      faceSubjectName: 'Drashwanth',   // must match CompreFace exactly
      faceRegistered: true,
      kycStatus:       'complete',
    },
    accounts: [
      {
        accountNumber: 'SB10000001',
        accountType:   'savings',
        branch:        'Vijayawada Benz Circle Branch',
        ifsc:          'SBIN0020082',
        balance:       8540000,          // ₹85,400.00
        status:        'active',
      },
      {
        accountNumber: 'CA10000002',
        accountType:   'current',
        branch:        'Vijayawada Benz Circle Branch',
        ifsc:          'SBIN0020082',
        balance:       23500000,         // ₹2,35,000.00
        status:        'active',
      },
    ],
  },

  // ── 2. Pavan Sai ──
  // Full KYC | Hyderabad | Savings + FD
  {
    user: {
      name:            'Pavan Sai Dharanikota',
      phone:           '9912345678',
      email:           'pavansai.konduri@outlook.com',
      dob:             new Date('1995-07-22'),
      gender:          'Male',
      aadhaar:         '345678901234',
      pan:             'PVSKK2345B',
      address: {
        line1:   '15 Jubilee Hills Road No. 36',
        line2:   '',
        city:    'Hyderabad',
        state:   'Telangana',
        pincode: '500033',
      },
      faceSubjectName: 'Pavan sai',    // note lowercase 's' — match CompreFace
      faceRegistered: true,
      kycStatus:       'complete',
    },
    accounts: [
      {
        accountNumber: 'SB10000003',
        accountType:   'savings',
        branch:        'Hyderabad Jubilee Hills Branch',
        ifsc:          'HDFC0001234',
        balance:       5200000,          // ₹52,000.00
        status:        'active',
      },
      {
        accountNumber: 'FD10000004',
        accountType:   'fd',
        branch:        'Hyderabad Jubilee Hills Branch',
        ifsc:          'HDFC0001234',
        balance:       50000000,         // ₹5,00,000.00 (FD principal)
        status:        'active',
      },
    ],
  },


  // ── 4. Sai Teja ──
  // Full KYC | Bangalore | Savings + Current + FD (3 accounts)
  {
    user: {
      name:            'Sai Teja Sunku',
      phone:           '9845112233',
      email:           'saiteja.boyapati@gmail.com',
      dob:             new Date('1993-04-30'),
      gender:          'Male',
      aadhaar:         '567890123456',
      pan:             'STTBP3456C',
      address: {
        line1:   '204 Koramangala 5th Block',
        line2:   'Opp. Forum Mall',
        city:    'Bangalore',
        state:   'Karnataka',
        pincode: '560095',
      },
      faceSubjectName: 'Sai Teja',
      faceRegistered: true,
      kycStatus:       'complete',
    },
    accounts: [
      {
        accountNumber: 'SB10000006',
        accountType:   'savings',
        branch:        'Bangalore Koramangala Branch',
        ifsc:          'AXIS0003456',
        balance:       18900000,         // ₹1,89,000.00
        status:        'active',
      },
      {
        accountNumber: 'CA10000007',
        accountType:   'current',
        branch:        'Bangalore Koramangala Branch',
        ifsc:          'AXIS0003456',
        balance:       75000000,         // ₹7,50,000.00
        status:        'active',
      },
      {
        accountNumber: 'FD10000008',
        accountType:   'fd',
        branch:        'Bangalore MG Road Branch',
        ifsc:          'AXIS0004567',
        balance:       100000000,        // ₹10,00,000.00
        status:        'active',
      },
    ],
  },

  // ── 5. Siddhartha ──
  // Full KYC | Vijayawada | Savings only | Frozen account
/*   {
    user: {
      name:            'Siddhartha Nalla',
      phone:           '9876123456',
      email:           'siddhartha.nalla@gmail.com',
      dob:             new Date('1997-09-14'),
      gender:          'Male',
      aadhaar:         '678901234567',
      pan:             'SDHNN4567D',
      address: {
        line1:   '7 Governorpet',
        line2:   'Near Clock Tower',
        city:    'Vijayawada',
        state:   'Andhra Pradesh',
        pincode: '520002',
      },
      faceSubjectName: 'Siddhartha',
      kycStatus:       'complete',
    },
    accounts: [
      {
        accountNumber: 'SB10000009',
        accountType:   'savings',
        branch:        'Vijayawada Governorpet Branch',
        ifsc:          'SBIN0021093',
        balance:       3400000,          // ₹34,000.00
        status:        'active',
      },
      {
        accountNumber: 'SB10000010',
        accountType:   'savings',
        branch:        'Vijayawada MG Road Branch',
        ifsc:          'SBIN0021094',
        balance:       500000,           // ₹5,000.00
        status:        'frozen',         // one account frozen — real scenario
      },
    ],
  }, */

  // ── 6. Vidhya ──
  // Full KYC | Hyderabad | Savings + FD | Female customer
  {
    user: {
      name:            'Vidhya Chandrasekaran',
      phone:           '9701234567',
      email:           'vidhya.lp@gmail.com',
      dob:             new Date('1992-12-05'),
      gender:          'Female',
      aadhaar:         '789012345678',
      pan:             'VDHPP5678E',
      address: {
        line1:   '32 Banjara Hills Road No. 12',
        line2:   'Beside GVK Mall',
        city:    'Hyderabad',
        state:   'Telangana',
        pincode: '500034',
      },
      faceSubjectName: 'Vidhya',
      faceRegistered: true,
      kycStatus:       'complete',
    },
    accounts: [
      {
        accountNumber: 'SB10000011',
        accountType:   'savings',
        branch:        'Hyderabad Banjara Hills Branch',
        ifsc:          'SBIN0020511',
        balance:       12700000,         // ₹1,27,000.00
        status:        'active',
      },
      {
        accountNumber: 'FD10000012',
        accountType:   'fd',
        branch:        'Hyderabad Banjara Hills Branch',
        ifsc:          'SBIN0020511',
        balance:       25000000,         // ₹2,50,000.00
        status:        'active',
      },
    ],
  },

  // ── 7. Vignesh ──
  // Full KYC | Chennai | Current account only | Business owner
  {
    user: {
      name:            'Vignesh Ramaswamy',
      phone:           '9962345678',
      email:           'vignesh.ramaswamy@business.com',
      dob:             new Date('1990-06-18'),
      gender:          'Male',
      aadhaar:         '890123456789',
      pan:             'VGNMR6789F',
      address: {
        line1:   '56 T Nagar North Usman Road',
        line2:   '2nd Floor, Kumaran Stores Building',
        city:    'Chennai',
        state:   'Tamil Nadu',
        pincode: '600017',
      },
      faceSubjectName: 'Vignesh',
      faceRegistered: true,
      kycStatus:       'complete',
    },
    accounts: [
      {
        accountNumber: 'CA10000013',
        accountType:   'current',
        branch:        'Chennai T Nagar Branch',
        ifsc:          'ICIC0003456',
        balance:       145000000,        // ₹14,50,000.00 (business account)
        status:        'active',
      },
    ],
  },

];

// ── Seed function ─────────────────────────────────────────────
const seedCustomers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...\n');

    // Clear existing data
    await User.deleteMany({});
    await Account.deleteMany({});
    console.log('Cleared existing users and accounts.\n');

    // Insert each customer and their accounts
    for (const customer of customers) {

      // Create user first — need _id for accounts
      const user = await User.create(customer.user);

      // Create all accounts linked to this user
      const accountDocs = customer.accounts.map((acc) => ({
        ...acc,
        userId: user._id,
      }));
      await Account.insertMany(accountDocs);

      // Log summary
      const accTypes = customer.accounts.map((a) => a.accountType).join(' + ');
      console.log(
        `✅ ${user.name.padEnd(25)} | ${accTypes.padEnd(30)} | ` +
        `KYC: ${user.kycStatus.padEnd(10)} | ${user.address.city}`
      );
    }

    console.log('\n── Database seeded successfully ─────────────────────');
    console.log(`   Users    : ${customers.length}`);
    console.log(`   Accounts : ${customers.reduce((sum, c) => sum + c.accounts.length, 0)}`);
    console.log('─────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

// Export for use in other scripts
module.exports = { seedCustomers, customers };

// Run if called directly
if (require.main === module) {
  seedCustomers();
}