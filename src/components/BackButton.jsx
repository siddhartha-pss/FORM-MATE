import React from 'react';

function BackButton({
  label = '← Back',
  onClick,
  variant = 'blue',
  style = {},
  ...props
}) {
  const accentColor = variant === 'purple'
    ? '#7c3aed'
    : variant === 'red'
    ? '#ef4444'
    : '#3b82f6';

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: '#141a29',
        border: `1.5px solid ${accentColor}`,
        color: '#f0efee',
        padding: '10px 18px',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'background-color 0.2s, border-color 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#141a29';
      }}
      {...props}
    >
      {label}
    </button>
  );
}

export default BackButton;
