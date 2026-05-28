/**
 * Script to update registered user names in MongoDB
 * Reads from seedCustomers.js and updates the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

// Import the customers from seedCustomers
const seedModule = require('./seedCustomers');
const customers = seedModule.customers || [];

async function updateUserNames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartbank');
    console.log('✓ Connected to MongoDB');

    if (customers.length === 0) {
      console.log('No customers found in seedCustomers.js');
      process.exit(0);
    }

    console.log(`\nUpdating ${customers.length} users...\n`);

    let updated = 0;
    let failed = 0;

    for (const customer of customers) {
      const { user } = customer;
      
      try {
        // Find user by phone and update name
        const result = await User.findOneAndUpdate(
          { phone: user.phone },
          { name: user.name },
          { new: true }
        );

        if (result) {
          console.log(`✓ Updated: ${user.phone} → ${user.name}`);
          updated++;
        } else {
          console.log(`✗ User not found: ${user.phone}`);
          failed++;
        }
      } catch (err) {
        console.error(`✗ Error updating ${user.phone}:`, err.message);
        failed++;
      }
    }

    console.log(`\n✓ Update complete: ${updated} updated, ${failed} failed`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateUserNames();
