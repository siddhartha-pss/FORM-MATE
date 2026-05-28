// client/src/utils/speechSupport.js
// ─────────────────────────────────────────────────────────────
// Checks whether the current browser supports the Web Speech API.
//
// Supported : Chrome (desktop + Android), Edge
// Not supported: Firefox, Safari, most mobile browsers
//
// For a kiosk running on a dedicated Chrome machine,
// this is completely fine.
// ─────────────────────────────────────────────────────────────

// Returns true if Web Speech API is available
export const isSpeechSupported = () => {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
};

// Returns the correct SpeechRecognition constructor for this browser
// Chrome uses the webkit-prefixed version
export const getSpeechRecognition = () => {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};