// client/src/hooks/useSessionGuard.js
// ─────────────────────────────────────────────────────────────
// Guards protected pages against:
//   1. Direct URL access (typing /accounts in browser)
//   2. Browser back button after session ends
//   3. Page refresh mid-session (state lost on refresh)
//
// Usage in any protected page:
//   useSessionGuard();   // add this one line at the top
//
// If userData is null → redirects to '/' using replace
// replace means this redirect does NOT add to browser history
// so pressing Back from Home won't return to the protected page
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp as useAppContext } from '../context/AppContext';

const useSessionGuard = () => {
  const navigate   = useNavigate();
  const { userData } = useAppContext();

  useEffect(() => {
    if (!userData) {
      // No active session — redirect to home
      // replace: true means this redirect REPLACES the current
      // history entry, so Back button goes to the page BEFORE
      // the protected page, not back to it
      console.log('[SessionGuard] No session — redirecting to home');
      navigate('/', { replace: true });
    }
  }, [userData, navigate]);

  // Returns whether guard is satisfied (for conditional rendering)
  return !!userData;
};

export default useSessionGuard;