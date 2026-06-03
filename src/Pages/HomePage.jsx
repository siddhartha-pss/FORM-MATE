// src/pages/HomePage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import BorderGlow from '../components/BorderGlow';
// No modal or overlay needed for onboarding
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* ── TOP SECTION: Logo ── */}
      <div className="home-header">
        <img src="/Trail.svg" alt="Trail Logo" className="bank-logo-image" />
      </div>

      {/* ── MIDDLE SECTION: Two main choices only ── */}
      <div className="home-options">
        {/* Option 1: Existing account holder */}
        <BorderGlow
          backgroundColor="#120f17"
          glowColor="220 50 60"
          borderRadius={20}
          glowRadius={25}
          glowIntensity={0.6}
          colors={['#7c3aed', '#a78bfa', '#c4b5fd']}
          className="option-card-glow"
        >
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
        </BorderGlow>

        {/* Option 2: New user */}
        <BorderGlow
          backgroundColor="#120f17"
          glowColor="180 50 60"
          borderRadius={20}
          glowRadius={25}
          glowIntensity={0.6}
          colors={['#0891b2', '#06b6d4', '#22d3ee']}
          className="option-card-glow"
        >
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
        </BorderGlow>
      </div>

      {/* ── BOTTOM SECTION: Help text ── */}
      <div className="home-footer">
        <p>Need help? Please contact the bank staff at the counter.</p>
      </div>
    </div>
  );
}

export default HomePage;