import React from 'react';

const DEFAULT_STEPS = ['Account Type', 'Documents', 'Confirm', 'Face Capture', 'Done'];

export default function OnboardingProgress({ activeStepIndex = 0, steps = DEFAULT_STEPS }) {
  const currentStep = Math.min(Math.max(activeStepIndex, 0), steps.length - 1);

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      margin: '8px 0 24px',
      width: '100%',
      maxWidth: '760px',
    }}>
      {steps.map((label, index) => (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: index <= currentStep ? '#3b82f6' : '#2a3347',
              color: '#f0efee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {index + 1}
            </div>
            <span style={{
              color: index === currentStep ? '#f0efee' : '#9aa8b8',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div style={{
              width: '24px',
              height: '2px',
              backgroundColor: '#3a4a60',
              flexShrink: 0,
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
