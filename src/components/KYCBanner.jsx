// client/src/components/KYCBanner.jsx
// ─────────────────────────────────────────────────────────────
// Reusable KYC status banner.
//
// Shows nothing    → kycStatus === 'complete'
// Yellow warning   → kycStatus === 'partial'
//   "One document missing. Some services may be restricted."
// Orange alert     → kycStatus === 'pending'
//   "KYC not started. Please visit the counter."
//
// Props:
//   kycStatus  String  — 'complete' | 'partial' | 'pending'
// ─────────────────────────────────────────────────────────────

import React from 'react';

// Config for each KYC state
const KYC_CONFIG = {
  partial: {
    icon:        '⚠️',
    title:       'KYC Incomplete',
    message:     'One KYC document is missing. Some services may be restricted.',
    subMessage:  'Please visit the counter to complete your KYC.',
    background:  '#fff8e1',
    border:      '#f9a825',
    titleColor:  '#e65100',
    textColor:   '#5d4037',
    iconBg:      '#fff3cd',
  },
  pending: {
    icon:        '🔴',
    title:       'KYC Pending',
    message:     'Your KYC verification has not been started.',
    subMessage:  'Please visit the bank counter before proceeding.',
    background:  '#fce4ec',
    border:      '#e53935',
    titleColor:  '#b71c1c',
    textColor:   '#6d2323',
    iconBg:      '#ffcdd2',
  },
};

function KYCBanner({ kycStatus }) {

  // Complete KYC — show nothing
  if (!kycStatus || kycStatus === 'complete') return null;

  const config = KYC_CONFIG[kycStatus];

  // Unknown status — show nothing rather than crash
  if (!config) return null;

  return (
    <div style={{
      width:           '100%',
      maxWidth:        '480px',
      backgroundColor: config.background,
      border:          `1.5px solid ${config.border}`,
      borderRadius:    '12px',
      padding:         '14px 18px',
      marginBottom:    '16px',
      display:         'flex',
      gap:             '14px',
      alignItems:      'flex-start',
      boxSizing:       'border-box',
    }}>

      {/* Icon circle */}
      <div style={{
        backgroundColor: config.iconBg,
        borderRadius:    '50%',
        width:           '40px',
        height:          '40px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        '20px',
        flexShrink:      0,
      }}>
        {config.icon}
      </div>

      {/* Text content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>

        <p style={{
          margin:     0,
          fontWeight: 700,
          fontSize:   '14px',
          color:      config.titleColor,
          fontFamily: 'Segoe UI, sans-serif',
        }}>
          {config.title}
        </p>

        <p style={{
          margin:     0,
          fontSize:   '13px',
          color:      config.textColor,
          fontFamily: 'Segoe UI, sans-serif',
          lineHeight: 1.4,
        }}>
          {config.message}
        </p>

        <p style={{
          margin:     0,
          fontSize:   '12px',
          color:      config.textColor,
          opacity:    0.8,
          fontFamily: 'Segoe UI, sans-serif',
        }}>
          {config.subMessage}
        </p>

      </div>
    </div>
  );
}

export default KYCBanner;