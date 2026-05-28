// client/src/context/AppContext.jsx
// ─────────────────────────────────────────────────────────────
// Changes from previous version:
//   + pendingUser  → holds face-recognized user BEFORE confirmation
//   + setPendingUser
//   + confirmUser() → moves pendingUser → userData (on YES click)
//   + resetSession() now also clears pendingUser
//
// Flow:
//   Face recognized → setPendingUser(data)
//   User clicks YES → confirmUser()  → userData is set
//   User clicks NO  → setPendingUser(null) → back to scan
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {

  // ── Confirmed session state ──
  // Set only after user clicks "Yes, that's me"
  const [userData,        setUserData]        = useState(null);
  const [accounts,        setAccounts]        = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedForm,    setSelectedForm]    = useState(null);

  // ── Pending state (face confirmed by system, not yet by user) ──
  // Holds recognized user temporarily until they confirm
  // Never shown to other screens — only FaceScanPage reads it
  const [pendingUser,     setPendingUser]     = useState(null);
  const [pendingAccounts, setPendingAccounts] = useState([]);

  // ── confirmUser ──
  // Called when user clicks "Yes, that's me"
  // Moves pending → confirmed. Now the session is officially active.
  const confirmUser = () => {
    setUserData(pendingUser);
    setAccounts(pendingAccounts);
    setPendingUser(null);       // clear pending — no longer needed
    setPendingAccounts([]);
  };

  // ── resetSession ──
  // Clears ALL state — confirmed and pending
  // Called by: Cancel button, Start Over, NO on confirmation
  const resetSession = () => {
    setUserData(null);
    setAccounts([]);
    setSelectedAccount(null);
    setSelectedForm(null);
    setPendingUser(null);
    setPendingAccounts([]);
  };

  return (
    <AppContext.Provider value={{
      // Confirmed session
      userData,        setUserData,
      accounts,        setAccounts,
      selectedAccount, setSelectedAccount,
      selectedForm,    setSelectedForm,
      // Pending (unconfirmed face recognition result)
      pendingUser,     setPendingUser,
      pendingAccounts, setPendingAccounts,
      // Actions
      confirmUser,
      resetSession,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
};