// client/src/pages/AccountSelectionPage.jsx
// Changes from previous version:
//   + import KYCBanner and formatBalance
//   + render <KYCBanner> below the instruction text
//   + add balance row to each account card

import React, { useState }      from 'react';
import { useNavigate }          from 'react-router-dom';
import { useApp }               from '../context/AppContext';
import KYCBanner                from '../components/KYCBanner';       // ← new
import { formatBalance }        from '../utils/formatCurrency';       // ← new
import './AccountSelectionPage.css';
import useSessionGuard from '../hooks/useSessionGuard';
import CancelButton    from '../components/CancelButton';

const ACCOUNT_ICONS = {
  savings: '🏦',
  current: '💼',
  fd:      '📈',
  loan:    '📋',
};

// Label for each account type shown on the card header
const ACCOUNT_LABELS = {
  savings: 'Savings Account',
  current: 'Current Account',
  fd:      'Fixed Deposit',
  loan:    'Loan Account',
};

function AccountSelectionPage() {

  const navigate = useNavigate();
  const { userData, accounts, setSelectedAccount } = useApp();

  const hasSession = useSessionGuard();
  if (!hasSession) return null;   // session guard handles redirect

  const [selectedId, setSelectedId] = useState(null);

  const handleSelect  = (id) => setSelectedId(id);

  const handleContinue = () => {
    if (!selectedId) return;
    const account = accounts.find((a) => a._id === selectedId);
    setSelectedAccount(account);
    navigate('/form-select', { replace: true });
  };

  return (
    <div className="account-container">

      {/* ── Top bar ── */}
      <div className="account-topbar">
        <button className="back-btn" onClick={() => navigate('/face-scan')}>
          ← Back
        </button>
        <h2 className="account-title">Select Account</h2>
        <CancelButton label="✕ Cancel" />
      </div>

      {/* ── Welcome message ── */}
      <p className="account-instruction">
        Welcome, <strong>{userData.name}</strong>.<br />
        Please select an account to continue.
      </p>

      {/* ── KYC Banner ── */}
      {/* Shows only if kycStatus is 'partial' or 'pending' */}
      {/* Nothing rendered if kycStatus === 'complete' */}
      <KYCBanner kycStatus={userData.kycStatus} />

      {/* ── Account cards ── */}
      <div className="account-list">
        {accounts.map((account) => {
          const isSelected = selectedId === account._id;

          return (
            <div
              key={account._id}
              className={`account-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(account._id)}
            >
              <div className="card-left">
                <div className={`radio-dot ${isSelected ? 'radio-filled' : ''}`} />

                <div className="card-icon">
                  {ACCOUNT_ICONS[account.accountType] || '🏦'}
                </div>

                <div className="card-info">
                  {/* Account type label */}
                  <p className="card-label">
                    {ACCOUNT_LABELS[account.accountType] || account.accountType}
                  </p>

                  {/* ── Field rows — now includes balance ── */}
                  {[
                    { label: 'Account No', value: account.accountNumber },
                    { label: 'Branch',     value: account.branch        },
                    { label: 'IFSC',       value: account.ifsc          },
                    // Balance row — formatted from paise to ₹
                    {
                      label: 'Balance',
                      value: formatBalance(account.balance),
                      // Highlight balance row slightly
                      highlight: true,
                    },
                  ].map((field) => (
                    <div key={field.label} className="card-field-row">
                      <span className="field-key">{field.label}</span>
                      <span className="field-colon">:</span>
                      <span
                        className="field-value"
                        style={
                          field.highlight
                            ? { fontWeight: 700, color: '#1a5a8e' }
                            : {}
                        }
                      >
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {isSelected && <div className="card-check">✓</div>}
            </div>
          );
        })}
      </div>

      {/* ── Continue button ── */}
      <button
        className={`continue-btn ${selectedId ? 'active' : 'disabled'}`}
        onClick={handleContinue}
        disabled={!selectedId}
      >
        Continue →
      </button>

      {!selectedId && (
        <p className="select-hint">Please select an account above to continue.</p>
      )}
    </div>
  );
}

export default AccountSelectionPage;