// client/src/pages/onboarding/AccountTypePage.jsx
// ─────────────────────────────────────────────────────────────
// Step 1 of new user onboarding.
// User selects the type of account they want to open.
//
// On selection → stores in OnboardingContext → navigates to
// document upload with replace (no back to home mid-flow).
// ─────────────────────────────────────────────────────────────

import React, { useState }  from 'react';
import { useNavigate }      from 'react-router-dom';
import { useOnboarding }    from '../../context/OnboardingContext';

// Account type definitions — icon, label, description
const ACCOUNT_TYPES = [
  {
    id:          'savings',
    icon:        '🏦',
    label:       'Savings Account',
    description: 'Best for individuals. Earn interest on your balance.',
    color:       '#1a3c5e',
  },
  {
    id:          'current',
    icon:        '💼',
    label:       'Current Account',
    description: 'Ideal for businesses. High transaction limits.',
    color:       '#2e7d32',
  },
  {
    id:          'salary',
    icon:        '💳',
    label:       'Salary Account',
    description: 'For salaried employees. Zero minimum balance.',
    color:       '#6a1b9a',
  },
  {
    id:          'joint',
    icon:        '👥',
    label:       'Joint Account',
    description: 'Shared account for two or more account holders.',
    color:       '#bf360c',
  },
  {
    id:          'fd',
    icon:        '📈',
    label:       'Fixed Deposit',
    description: 'Earn higher interest. Lock-in period applies.',
    color:       '#0277bd',
  },
];

function AccountTypePage() {

  const navigate                    = useNavigate();
  const { setAccountType, resetOnboarding } = useOnboarding();
  const [selectedType, setSelectedType]     = useState('');

  const handleContinue = () => {
    if (!selectedType) return;
    setAccountType(selectedType);
    // replace → can't press Back to return here from document upload
    navigate('/new-user/documents', { replace: true });
  };

  const handleCancel = () => {
    resetOnboarding();
    navigate('/', { replace: true });
  };

  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: '#f0f4f8',
      fontFamily:      'Segoe UI, sans-serif',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      padding:         '0 20px 48px',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        width:          '100%',
        maxWidth:       '560px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        '24px 0 8px',
      }}>
        <button onClick={handleCancel} style={{
          background: 'none', border: 'none', color: '#1a3c5e',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
        }}>
          ← Back
        </button>
        <h2 style={{ margin: 0, color: '#1a3c5e', fontSize: '20px', fontWeight: 700 }}>
          New Account
        </h2>
        <div style={{ width: '70px' }} />
      </div>

      {/* ── Step indicator ── */}
      <div style={{ display: 'flex', gap: '8px', margin: '8px 0 24px' }}>
        {['Account Type', 'Documents', 'Confirm', 'Face Capture', 'Done'].map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width:           '28px',
              height:          '28px',
              borderRadius:    '50%',
              backgroundColor: i === 0 ? '#1a3c5e' : '#d0e0ed',
              color:           i === 0 ? '#fff' : '#7a95ae',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '12px',
              fontWeight:      700,
              flexShrink:      0,
            }}>
              {i + 1}
            </div>
            {i < 4 && (
              <div style={{ width: '24px', height: '2px',
                backgroundColor: '#d0e0ed', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      <p style={{ color: '#4a6a8a', fontSize: '16px', margin: '0 0 28px',
        textAlign: 'center' }}>
        Which type of account would you like to open?
      </p>

      {/* ── Account type cards ── */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '14px',
        width:         '100%',
        maxWidth:      '480px',
      }}>
        {ACCOUNT_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <div
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              style={{
                display:         'flex',
                alignItems:      'center',
                gap:             '16px',
                backgroundColor: isSelected ? '#eaf2fb' : '#ffffff',
                border:          `2px solid ${isSelected ? type.color : '#d0e0ed'}`,
                borderRadius:    '14px',
                padding:         '18px 20px',
                cursor:          'pointer',
                transition:      'border-color 0.2s, background-color 0.2s',
              }}
            >
              {/* Radio dot */}
              <div style={{
                width:           '18px',
                height:          '18px',
                borderRadius:    '50%',
                border:          `2px solid ${isSelected ? type.color : '#aac4e0'}`,
                backgroundColor: isSelected ? type.color : 'transparent',
                flexShrink:      0,
                transition:      'all 0.2s',
              }} />

              {/* Icon */}
              <div style={{ fontSize: '28px', flexShrink: 0 }}>{type.icon}</div>

              {/* Text */}
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700,
                  color: '#1a3c5e', fontSize: '15px' }}>
                  {type.label}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#5a7a99' }}>
                  {type.description}
                </p>
              </div>

              {/* Selected tick */}
              {isSelected && (
                <div style={{
                  marginLeft:      'auto',
                  backgroundColor: type.color,
                  color:           '#fff',
                  width:           '24px',
                  height:          '24px',
                  borderRadius:    '50%',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  fontSize:        '13px',
                  fontWeight:      700,
                  flexShrink:      0,
                }}>
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Continue button ── */}
      <button
        onClick={handleContinue}
        disabled={!selectedType}
        style={{
          marginTop:       '32px',
          padding:         '16px 52px',
          fontSize:        '16px',
          fontWeight:      700,
          border:          'none',
          borderRadius:    '12px',
          cursor:          selectedType ? 'pointer' : 'not-allowed',
          backgroundColor: selectedType ? '#1a3c5e' : '#ccd9e5',
          color:           selectedType ? '#ffffff' : '#8aa0b5',
          transition:      'background-color 0.2s',
        }}
      >
        Continue →
      </button>

    </div>
  );
}

export default AccountTypePage;