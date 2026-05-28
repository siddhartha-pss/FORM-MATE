// client/src/utils/matchFormFromSpeech.js
// ─────────────────────────────────────────────────────────────
// Matches a spoken transcript against the keywords array
// stored in each form template (fetched from MongoDB).
//
// How matching works:
//   For each form's keywords array, check if any keyword
//   appears as a substring inside the transcript.
//   First match wins.
//
// Examples:
//   transcript: "i want a cheque book please"
//   cheque_book_request keywords: ["cheque", "cheque book", "chequebook"]
//   → "cheque book" found in transcript → MATCH ✅
//
//   transcript: "i need a statement"
//   account_statement keywords: ["statement", "account statement"]
//   → "statement" found in transcript → MATCH ✅
//
//   transcript: "hello"
//   → no keywords match → null (no match)
//
// @param transcript  String  — lowercase spoken text
// @param forms       Array   — form objects from MongoDB with keywords[]
// @returns matched form object | null
// ─────────────────────────────────────────────────────────────

export const matchFormFromSpeech = (transcript, forms) => {
  if (!transcript || !forms || forms.length === 0) return null;

  // Normalise transcript — lowercase + trim
  let normalised = transcript.toLowerCase().trim();

  // Normalize common merged words that appear in speech transcripts.
  // E.g. "checkbook request" should still match "check book" keywords.
  normalised = normalised.replace(/\bcheckbook\b/g, 'check book');

  // Check each form's keyword list
  for (const form of forms) {
    if (!form.keywords || form.keywords.length === 0) continue;

    // Check each keyword for this form
    for (const keyword of form.keywords) {
      // Use includes() — keyword can appear anywhere in transcript
      // "i want to request a cheque book" → includes "cheque book" → true
      if (normalised.includes(keyword.toLowerCase())) {
        return form;    // return the matched form object immediately
      }
    }
  }

  // No form matched
  return null;
};

// ── Confidence helper ──
// Returns a readable confidence label for display
export const getConfidenceLabel = (confidence) => {
  if (confidence >= 0.9) return 'High confidence';
  if (confidence >= 0.7) return 'Good match';
  if (confidence >= 0.5) return 'Possible match';
  return 'Low confidence';
};