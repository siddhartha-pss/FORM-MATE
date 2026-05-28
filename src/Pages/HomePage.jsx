// src/pages/HomePage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
// No modal or overlay needed for onboarding
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* ── TOP SECTION: Bank branding ── */}
      <div className="home-header">
        <div className="bank-logo">🏦</div>
        <h1 className="bank-title">SmartBank Kiosk</h1>
        <p className="bank-subtitle">AI-Powered Form Filling System</p>
      </div>

      {/* ── MIDDLE SECTION: Two main choices only ── */}
      <div className="home-options">
        {/* Option 1: Existing account holder */}
        <button
          className="option-card option-existing"
          onClick={() => navigate('/face-scan')}
        >
          <div className="option-icon">👤</div>
          <h2 className="option-title">I Have an Account</h2>
          <p className="option-desc">
            Existing customers — scan your face or enter account number
          </p>
        </button>

        {/* Option 2: New user */}
        <button
          className="option-card option-new"
          onClick={() => navigate('/new-user')}
        >
          <div className="option-icon">🆕</div>
          <h2 className="option-title option-new-title">New User</h2>
          <p className="option-desc option-new-desc">
            New to SmartBank? Start your registration here.
          </p>
        </button>
      </div>

      {/* ── BOTTOM SECTION: Help text ── */}
      <div className="home-footer">
        <p>Need help? Please contact the bank staff at the counter.</p>
      </div>
    </div>
  );
}

export default HomePage;