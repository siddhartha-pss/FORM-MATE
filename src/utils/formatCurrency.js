// client/src/utils/formatCurrency.js
// ─────────────────────────────────────────────────────────────
// Formats a balance stored in paise (integer) into a
// human-readable Indian Rupee string.
//
// Why paise?
//   Storing money as integers avoids floating-point errors.
//   ₹12,500.50 is stored as 1250050 (paise).
//
// Examples:
//   formatBalance(8540000)  → "₹85,400.00"
//   formatBalance(145000000)→ "₹14,50,000.00"
//   formatBalance(0)        → "₹0.00"
// ─────────────────────────────────────────────────────────────

// Indian number system: groups of 2 after the first 3 digits
// 1,00,000 (one lakh) — not 100,000
export const formatBalance = (paise = 0) => {
  // Convert paise to rupees
  const rupees = paise / 100;

  // Use Intl.NumberFormat for correct Indian grouping
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
};

// Short format for display on small cards
// 8540000  → "₹85.4K"
// 50000000 → "₹5L"
// 145000000→ "₹14.5L"
export const formatBalanceShort = (paise = 0) => {
  const rupees = paise / 100;

  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(1)}Cr`;   // crore
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(1)}L`;      // lakh
  }
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}K`;        // thousand
  }
  return `₹${rupees.toFixed(2)}`;
};