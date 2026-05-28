// client/src/context/OnboardingContext.jsx
// ─────────────────────────────────────────────────────────────
// Manages all state for the new user registration flow.
// Completely separate from AppContext (existing user sessions).
//
// State shape:
//   accountType   → selected account type (savings, current, etc.)
//   extractedData → raw OCR output from Aadhaar + PAN
//   confirmedData → user-edited version of extractedData
//   capturedFaces → array of Blobs from webcam
//   newUserId     → MongoDB _id after user is saved
//   subjectName   → name used in CompreFace for this user
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {

  // Step 1 — Account type
  const [accountType, setAccountType] = useState('');

  // Step 2 — OCR output (raw from backend)
  const [extractedData, setExtractedData] = useState({
    name:    '',
    dob:     '',
    gender:  '',
    aadhaar: '',
    pan:     '',
    address: {
      line1:   '',
      city:    '',
      state:   '',
      pincode: '',
    },
  });

  // Step 3 — User-confirmed/edited data
  // Starts as a copy of extractedData, user edits it
  const [confirmedData, setConfirmedData] = useState(null);

  // Step 4 — Face images captured by webcam
  const [capturedFaces, setCapturedFaces] = useState([]);  // array of Blob

  // Step 5 — After saving to MongoDB
  const [newUserId,    setNewUserId]    = useState(null);
  const [subjectName,  setSubjectName]  = useState('');

  // Add a face capture to the array
  const addFaceCapture = (blob) => {
    setCapturedFaces((prev) => [...prev, blob]);
  };

  // Remove a specific capture (if user wants to retake)
  const removeFaceCapture = (index) => {
    setCapturedFaces((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset everything — used on cancel or start over
  const resetOnboarding = () => {
    setAccountType('');
    setExtractedData({
      name: '', dob: '', gender: '', aadhaar: '', pan: '',
      address: { line1: '', city: '', state: '', pincode: '' },
    });
    setConfirmedData(null);
    setCapturedFaces([]);
    setNewUserId(null);
    setSubjectName('');
  };

  return (
    <OnboardingContext.Provider value={{
      accountType,    setAccountType,
      extractedData,  setExtractedData,
      confirmedData,  setConfirmedData,
      capturedFaces,  setCapturedFaces,
      addFaceCapture, removeFaceCapture,
      newUserId,      setNewUserId,
      subjectName,    setSubjectName,
      resetOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be inside OnboardingProvider');
  return ctx;
};