// client/src/pages/onboarding/RegistrationSuccessPage.jsx
// ─────────────────────────────────────────────────────────────
// Final step of new user onboarding.
// Displays success message and guides user to home.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import OnboardingProgress from '../../components/OnboardingProgress';

function RegistrationSuccessPage() {

  const navigate = useNavigate();
  const { confirmedData, resetOnboarding } = useOnboarding();

  const handleGoHome = () => {
    resetOnboarding();
    navigate('/', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#120f17',
      fontFamily: 'Segoe UI, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '24px',
      color: '#f0efee',
    }}>

      {/* Success Icon */}
      <div style={{
        fontSize: '80px',
        animation: 'scale 0.6s ease-in-out',
      }}>
        ✅
      </div>

      {/* Success Title */}
      <OnboardingProgress activeStepIndex={4} />
      <h1 style={{
        color: '#f0efee',
        margin: 0,
        fontSize: '32px',
        fontWeight: 700,
      }}>
        Registration Complete!
      </h1>

      {/* Success Message */}
      <p style={{
        color: '#9aa8b8',
        fontSize: '15px',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: '1.6',
        margin: 0,
      }}>
        Your account has been successfully created. You can now log in and start using our services.
      </p>

      {/* Account Details Summary */}
      <div style={{
        backgroundColor: '#141a29',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 16px rgba(59,130,246,0.08)',
        border: '1px solid #2a3347',
      }}>
        <h3 style={{ color: '#f0efee', marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
          Account Details
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            borderBottom: '1px solid #262c3a',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Name:</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px' }}>
              {confirmedData?.name || 'N/A'}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            borderBottom: '1px solid #262c3a',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Date of Birth:</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px' }}>
              {confirmedData?.dob || 'N/A'}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '8px',
            borderBottom: '1px solid #262c3a',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Gender:</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px' }}>
              {confirmedData?.gender || 'N/A'}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>City:</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px' }}>
              {confirmedData?.address?.city || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        backgroundColor: '#111827',
        borderLeft: '4px solid #3b82f6',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '400px',
        width: '100%',
        fontSize: '13px',
        color: '#cbd5e1',
        lineHeight: '1.6',
      }}>
        <strong style={{ color: '#f0efee' }}>Next Steps:</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px', marginBottom: 0 }}>
          <li>Your account details are securely stored</li>
          <li>Proceed to the home screen to log in</li>
          <li>You can now use our form filling services</li>
        </ul>
      </div>

      {/* Action Button */}
      <button
        onClick={handleGoHome}
        style={{
          padding: '14px 48px',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Segoe UI, sans-serif',
        }}
      >
        ↩ Go to Home
      </button>

      {/* CSS Animation */}
      <style>{`
        @keyframes scale {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default RegistrationSuccessPage;
