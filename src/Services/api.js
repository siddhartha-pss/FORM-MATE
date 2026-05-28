// client/src/services/api.js
// ─────────────────────────────────────────────────────────────
// Centralised API service layer.
//
// All backend calls live here — not inside components.
// This makes it easy to:
//   - Change the base URL in one place
//   - Add auth headers later (Phase 4+)
//   - Handle errors consistently
//
// Usage inside any component:
//   import api from '../services/api';
//   const response = await api.identifyUser({ accountNumber: 'SB001' });
// ─────────────────────────────────────────────────────────────

import axios from 'axios';

// axios instance — base URL uses the React proxy
// All requests automatically go to http://localhost:5000
const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,   // 10 second timeout — kiosk must feel responsive
});

// ── User APIs ──────────────────────────────────────────────────

// Identify a user by account number OR phone number
// Called from: FallbackPage
// Returns: { user, accounts[] }
export const identifyUser = async (identifier) => {
  const response = await axiosInstance.post('/users/identify', identifier);
  return response.data;
};

// Get full user profile by _id
// Called from: any screen needing full profile
export const getUserById = async (userId) => {
  const response = await axiosInstance.get(`/users/${userId}`);
  return response.data;
};

// ── Account APIs ───────────────────────────────────────────────

// Get all accounts for a user
// Called from: AccountSelectionPage
// Returns: accounts[]
export const getAccountsByUser = async (userId) => {
  const response = await axiosInstance.get(`/accounts/user/${userId}`);
  return response.data;
};

// ── Form APIs ──────────────────────────────────────────────────

// Get list of all available form templates
// Called from: FormSelectionPage
// Optional: pass accountType to filter relevant forms
export const getAllForms = async (accountType = '') => {
  const query    = accountType ? `?accountType=${accountType}` : '';
  const response = await axiosInstance.get(`/forms${query}`);
  return response.data;
};

// Get a single form template by formId
// Called from: FormFillPage (before fill)
export const getFormById = async (formId) => {
  const response = await axiosInstance.get(`/forms/${formId}`);
  return response.data;
};

// Fill a form with real user + account data (the form engine)
// Called from: FormFillPage
// Returns: { formId, formName, fields[] with resolved values }
export const fillForm = async (formId, userId, accountId) => {
  const response = await axiosInstance.post('/forms/fill', {
    formId,
    userId,
    accountId,
  });
  return response.data;
};

// ── Submission APIs ────────────────────────────────────────────

// Save a completed form submission
// Called from: FormFillPage on submit
export const submitForm = async (submissionData) => {
  const response = await axiosInstance.post('/submissions', submissionData);
  return response.data;
};

// Get all past submissions for a user
export const getSubmissionsByUser = async (userId) => {
  const response = await axiosInstance.get(`/submissions/user/${userId}`);
  return response.data;
};

// Add to client/src/services/api.js

// ── Face Recognition API ───────────────────────────────────────

// Send a captured image blob to the backend for recognition
// Returns { success, matched, similarity, data: { user, accounts } }
export const recognizeFace = async (imageBlob) => {
  const formData = new FormData();
  formData.append('image', imageBlob, 'capture.jpg');

  // Use axiosInstance but override Content-Type for multipart
  const response = await axiosInstance.post('/face/recognize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 20000,
  });
  return response.data;
};

export default axiosInstance;