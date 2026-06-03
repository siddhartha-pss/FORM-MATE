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
import Dock                 from '../../components/Dock';
import BackButton           from '../../components/BackButton';
import OnboardingProgress   from '../../components/OnboardingProgress';

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

  const dockItems = ACCOUNT_TYPES.map((type) => ({
    icon: (
      <div className="account-type-dock-card">
        <div className="account-type-dock-emoji">{type.icon}</div>
        <div className="account-type-dock-name">{type.label}</div>
        <div className="account-type-dock-desc">{type.description}</div>
      </div>
    ),
    label: type.label,
    onClick: () => setSelectedType(type.id),
    className: selectedType === type.id ? 'account-type-dock-selected' : '',
  }));

  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: '#120f17',
      color:           '#f0efee',
      fontFamily:      'Segoe UI, sans-serif',
      display:         'flex',
      flexDirection:   'column',
      justifyContent:  'space-between',
      alignItems:      'center',
      padding:         '24px 20px 48px',
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
        <BackButton label="← Back" onClick={handleCancel} />
        <h2 style={{ margin: 0, color: '#f0efee', fontSize: '20px', fontWeight: 700 }}>
          New Account
        </h2>
        <div style={{ width: '70px' }} />
      </div>

      <div style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        alignItems:     'center',
        width:          '100%',
        maxWidth:       '1400px',
        gap:            '24px',
      }}>
        <OnboardingProgress activeStepIndex={0} />

        <p style={{ color: '#b0b8c0', fontSize: '16px', margin: 0,
          textAlign: 'center', maxWidth: '700px' }}>
          Which type of account would you like to open?
        </p>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Dock
          items={dockItems}
          isVertical={false}
          panelHeight={240}
          baseItemSize={220}
          magnification={260}
          distance={260}
          className="account-type-dock dock-center"
        />
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
          backgroundColor: selectedType ? '#3b82f6' : '#2a3347',
          color:           '#ffffff',
          opacity:         selectedType ? 1 : 0.6,
          transition:      'background-color 0.2s, opacity 0.2s',
        }}
      >
        Continue →
      </button>
      </div>

    </div>
  );
}

export default AccountTypePage;