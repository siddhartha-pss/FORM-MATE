// client/src/components/CancelButton.jsx
// ─────────────────────────────────────────────────────────────
// A visible "Cancel / Exit" button shown on all protected pages.
//
// On click:
//   1. Shows a confirmation dialog (prevents accidental taps)
//   2. If confirmed → resets entire session state
//   3. Navigates to home using replace (no back-button return)
//
// Props:
//   label    String  — button text (default: "✕ Cancel")
//   showConfirm Boolean — whether to ask before cancelling (default: true)
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate }     from 'react-router-dom';
import { useApp }          from '../context/AppContext';

function CancelButton({ label = '✕ Cancel Process', showConfirm = true }) {

  const navigate      = useNavigate();
  const { resetSession } = useApp();
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = () => {
    if (showConfirm) {
      setShowDialog(true);   // show confirmation dialog first
    } else {
      performCancel();
    }
  };

  const performCancel = () => {
    resetSession();                       // clear all state
    navigate('/', { replace: true });     // go home, no history entry
  };

  return (
    <>
      {/* ── Cancel trigger button ── */}
      <button
        onClick={handleClick}
        style={{
          background:   'none',
          border:       '1.5px solid #e74c3c',
          color:        '#e74c3c',
          padding:      '6px 14px',
          borderRadius: '8px',
          fontSize:     '13px',
          fontWeight:   '600',
          cursor:       'pointer',
          fontFamily:   'Segoe UI, sans-serif',
          transition:   'background-color 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fdf0ee'}
        onMouseOut={(e)  => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        {label}
      </button>

      {/* ── Confirmation Dialog ── */}
      {showDialog && (
        <div style={{
          position:        'fixed',
          inset:           0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          zIndex:          9999,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius:    '16px',
            padding:         '32px 28px',
            maxWidth:        '360px',
            width:           '90%',
            textAlign:       'center',
            boxShadow:       '0 8px 32px rgba(0,0,0,0.18)',
            fontFamily:      'Segoe UI, sans-serif',
          }}>

            {/* Icon */}
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>

            {/* Message */}
            <h3 style={{ color: '#1a3c5e', margin: '0 0 10px', fontSize: '18px' }}>
              Cancel this process?
            </h3>
            <p style={{ color: '#5a7a99', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.5 }}>
              All progress will be lost and you will be returned to the home screen.
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDialog(false)}
                style={{
                  flex:         1,
                  padding:      '12px',
                  border:       '1.5px solid #c0d4e8',
                  borderRadius: '10px',
                  background:   '#ffffff',
                  color:        '#1a3c5e',
                  fontSize:     '14px',
                  fontWeight:   '600',
                  cursor:       'pointer',
                }}
              >
                ← Continue
              </button>

              <button
                onClick={performCancel}
                style={{
                  flex:         1,
                  padding:      '12px',
                  border:       'none',
                  borderRadius: '10px',
                  background:   '#e74c3c',
                  color:        '#ffffff',
                  fontSize:     '14px',
                  fontWeight:   '600',
                  cursor:       'pointer',
                }}
              >
                Yes, Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default CancelButton;