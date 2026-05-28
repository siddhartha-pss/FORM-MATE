// server/seed/seedForms.js
// ─────────────────────────────────────────────────────────────
// Seeds form templates into MongoDB.
//
// HOW TO RUN:
//   node seed/seedForms.js
//
// Each template defines:
//   - formId     : unique key used by API routes
//   - fields[]   : ordered list of form fields
//   - dataSource : dot-path into user/account object
//                  e.g. "user.name", "account.branch"
//                  null = user fills manually
//
// applicableFor controls which account types can use each form.
// keywords are used by the STT matcher (Phase 4).
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const mongoose     = require('mongoose');
const FormTemplate = require('../models/formTemplate');

// ── Form Templates ──
const formTemplates = [

  // ── 1. Deposit Form ─────────────────────────────────────────
  {
    formId:       'deposit_form',
    formName:     'Deposit Form',
    description:  'Deposit money into the selected account',
    applicableFor: ['savings', 'current', 'fd', 'loan'],
    keywords:     ['deposit', 'cash deposit', 'money deposit'],
    fields: [
      {
        fieldId:    'customer_name',
        label:      'Customer Name',
        type:       'text',
        dataSource: 'user.name',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'account_number',
        label:      'Account Number',
        type:       'text',
        dataSource: 'account.accountNumber',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'branch',
        label:      'Branch',
        type:       'text',
        dataSource: 'account.branch',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'date',
        label:      'Current Date',
        type:       'date',
        dataSource: 'system.currentDate',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'amount',
        label:      'Amount',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'Enter amount to deposit',
      },
    ],
  },

  // ── 2. Withdrawal Form ──────────────────────────────────────
  {
    formId:       'withdrawal_form',
    formName:     'Withdrawal Form',
    description:  'Withdraw money from the selected account',
    applicableFor: ['savings', 'current', 'fd', 'loan'],
    keywords:     ['withdrawal', 'cash withdrawal', 'money withdrawal'],
    fields: [
      {
        fieldId:    'customer_name',
        label:      'Customer Name',
        type:       'text',
        dataSource: 'user.name',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'account_number',
        label:      'Account Number',
        type:       'text',
        dataSource: 'account.accountNumber',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'branch',
        label:      'Branch',
        type:       'text',
        dataSource: 'account.branch',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'date',
        label:      'Current Date',
        type:       'date',
        dataSource: 'system.currentDate',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'amount',
        label:      'Amount',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'Enter amount to withdraw',
      },
    ],
  },

  // ── 3. Cheque Book Request ──────────────────────────────────
  {
    formId:       'cheque_book_request',
    formName:     'Cheque Book Request',
    description:  'Request a new cheque book for your account',
    applicableFor: ['savings', 'current'],
    keywords:     ['cheque', 'cheque book', 'chequebook', 'check book', 'checkbook'],
    fields:[
      {
        fieldId:    'applicant_name',
        label:      'Applicant Name',
        type:       'text',
        dataSource: 'user.name',      // auto-filled from user.name
        autoFill:   true,
        required:   true,
        placeholder: '',
      },
      {
        fieldId:    'account_number',
        label:      'Account Number',
        type:       'text',
        dataSource: 'account.accountNumber',  // auto-filled from account
        autoFill:   true,
        required:   true,
        placeholder: '',
      },
      {
        fieldId:    'branch_name',
        label:      'Branch Name',
        type:       'text',
        dataSource: 'account.branch',   // auto-filled from account
        autoFill:   true,
        required:   true,
        placeholder: '',
      },
      {
        fieldId:    'mobile_number',
        label:      'Mobile Number',
        type:       'text',
        dataSource: 'user.phone',       // auto-filled from user
        autoFill:   true,
        required:   true,
        placeholder: '',
      },
      {
        fieldId:    'num_leaves',
        label:      'No. of Cheque Leaves',
        type:       'select',
        dataSource: null,               // user selects manually
        autoFill:   false,
        required:   true,
        options:    ['10 Leaves', '25 Leaves', '50 Leaves'],
      },
      {
        fieldId:    'date',
        label:      'Date of Request',
        type:       'date',
        dataSource: null,               // user fills manually
        autoFill:   false,
        required:   true,
        placeholder: '',
      },
      {
        fieldId:    'remarks',
        label:      'Remarks',
        type:       'textarea',
        dataSource: null,
        autoFill:   false,
        required:   false,
        placeholder: 'Any special instructions (optional)',
      },
      {
        fieldId:    'signature',
        label:      'Applicant Signature',
        type:       'signature',
        dataSource: null,               // NEVER auto-fill signatures
        autoFill:   false,
        required:   true,
        placeholder: '',
      },
    ],
  },

  // ── 2. Address Change ───────────────────────────────────────
  {
    formId:       'address_change',
    formName:     'Address Change',
    description:  'Update your registered address with the bank',
    applicableFor: ['savings', 'current', 'fd', 'loan'],
    keywords:     ['address', 'address change', 'update address', 'change address'],
    fields: [
      {
        fieldId:    'applicant_name',
        label:      'Applicant Name',
        type:       'text',
        dataSource: 'user.name',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'account_number',
        label:      'Account Number',
        type:       'text',
        dataSource: 'account.accountNumber',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'old_address',
        label:      'Current Address',
        type:       'textarea',
        dataSource: 'user.address',     // backend will format this
        autoFill:   true,
        required:   true,
        placeholder: '',
      },
      {
        fieldId:    'new_address_line1',
        label:      'New Address Line 1',
        type:       'text',
        dataSource: null,               // user fills new address
        autoFill:   false,
        required:   true,
        placeholder: 'House/Flat No, Street Name',
      },
      {
        fieldId:    'new_city',
        label:      'New City',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'City',
      },
      {
        fieldId:    'new_state',
        label:      'New State',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'State',
      },
      {
        fieldId:    'new_pincode',
        label:      'New Pincode',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: '6-digit pincode',
      },
      {
        fieldId:    'signature',
        label:      'Applicant Signature',
        type:       'signature',
        dataSource: null,
        autoFill:   false,
        required:   true,
      },
    ],
  },

  // ── 3. Account Statement ────────────────────────────────────
  {
    formId:       'account_statement',
    formName:     'Account Statement',
    description:  'Request a printed account statement for a date range',
    applicableFor: ['savings', 'current', 'loan'],
    keywords:     ['statement', 'account statement', 'bank statement', 'passbook'],
    fields: [
      {
        fieldId:    'applicant_name',
        label:      'Applicant Name',
        type:       'text',
        dataSource: 'user.name',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'account_number',
        label:      'Account Number',
        type:       'text',
        dataSource: 'account.accountNumber',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'account_type',
        label:      'Account Type',
        type:       'text',
        dataSource: 'account.accountType',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'from_date',
        label:      'From Date',
        type:       'date',
        dataSource: null,
        autoFill:   false,
        required:   true,
      },
      {
        fieldId:    'to_date',
        label:      'To Date',
        type:       'date',
        dataSource: null,
        autoFill:   false,
        required:   true,
      },
      {
        fieldId:    'email',
        label:      'Email (for soft copy)',
        type:       'text',
        dataSource: 'user.email',       // auto-filled but user can change
        autoFill:   true,
        required:   false,
        placeholder: 'your@email.com',
      },
      {
        fieldId:    'signature',
        label:      'Applicant Signature',
        type:       'signature',
        dataSource: null,
        autoFill:   false,
        required:   true,
      },
    ],
  },

  // ── 4. FD Opening ───────────────────────────────────────────
  {
    formId:       'fd_opening',
    formName:     'Fixed Deposit Opening',
    description:  'Open a new fixed deposit account',
    applicableFor: ['savings', 'current'],
    keywords:     ['fd', 'fixed deposit', 'fixed', 'deposit'],
    fields: [
      {
        fieldId:    'applicant_name',
        label:      'Applicant Name',
        type:       'text',
        dataSource: 'user.name',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'source_account',
        label:      'Source Account Number',
        type:       'text',
        dataSource: 'account.accountNumber',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'fd_amount',
        label:      'FD Amount (₹)',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'Minimum ₹1000',
      },
      {
        fieldId:    'fd_tenure',
        label:      'Tenure',
        type:       'select',
        dataSource: null,
        autoFill:   false,
        required:   true,
        options:    ['6 Months', '1 Year', '2 Years', '3 Years', '5 Years'],
      },
      {
        fieldId:    'interest_payout',
        label:      'Interest Payout',
        type:       'select',
        dataSource: null,
        autoFill:   false,
        required:   true,
        options:    ['Monthly', 'Quarterly', 'At Maturity'],
      },
      {
        fieldId:    'nominee_name',
        label:      'Nominee Name',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   false,
        placeholder: 'Nominee full name',
      },
      {
        fieldId:    'signature',
        label:      'Applicant Signature',
        type:       'signature',
        dataSource: null,
        autoFill:   false,
        required:   true,
      },
    ],
  },

  // ── 5. NEFT / RTGS ──────────────────────────────────────────
  {
    formId:       'neft_rtgs',
    formName:     'NEFT / RTGS Transfer',
    description:  'Transfer funds to another bank account',
    applicableFor: ['savings', 'current'],
    keywords:     ['neft', 'rtgs', 'transfer', 'fund transfer', 'send money'],
    fields: [
      {
        fieldId:    'sender_name',
        label:      'Sender Name',
        type:       'text',
        dataSource: 'user.name',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'sender_account',
        label:      'Sender Account Number',
        type:       'text',
        dataSource: 'account.accountNumber',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'sender_ifsc',
        label:      'Sender IFSC',
        type:       'text',
        dataSource: 'account.ifsc',
        autoFill:   true,
        required:   true,
      },
      {
        fieldId:    'beneficiary_name',
        label:      'Beneficiary Name',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'Recipient full name',
      },
      {
        fieldId:    'beneficiary_account',
        label:      'Beneficiary Account Number',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'Recipient account number',
      },
      {
        fieldId:    'beneficiary_ifsc',
        label:      'Beneficiary IFSC',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'e.g. HDFC0001234',
      },
      {
        fieldId:    'transfer_amount',
        label:      'Transfer Amount (₹)',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   true,
        placeholder: 'Amount in rupees',
      },
      {
        fieldId:    'transfer_type',
        label:      'Transfer Type',
        type:       'select',
        dataSource: null,
        autoFill:   false,
        required:   true,
        options:    ['NEFT', 'RTGS'],
      },
      {
        fieldId:    'remarks',
        label:      'Remarks',
        type:       'text',
        dataSource: null,
        autoFill:   false,
        required:   false,
        placeholder: 'Purpose of transfer (optional)',
      },
      {
        fieldId:    'signature',
        label:      'Applicant Signature',
        type:       'signature',
        dataSource: null,
        autoFill:   false,
        required:   true,
      },
    ],
  },

];

// ── Seed Function ──
const seedForms = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for form seeding...');

    // Clear existing templates and insert fresh
    await FormTemplate.deleteMany({});
    console.log('Cleared existing form templates.');

    const created = await FormTemplate.insertMany(formTemplates);
    console.log(`\nInserted ${created.length} form templates:`);
    created.forEach(f => console.log(`  → ${f.formId} (${f.fields.length} fields)`));

  } catch (error) {
    console.error('Seeding forms failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected. Form seeding complete.');
  }
};

seedForms();