// client/src/pages/FallbackPage.jsx

import React, { useState } from 'react';
import { useNavigate }     from 'react-router-dom';
import { useApp }          from '../context/AppContext';
import { identifyUser }    from '../services/api';

function FallbackPage() {

  const navigate = useNavigate();
  const { setUserData, setAccounts } = useApp();

  // What the user typed in the input
  const [inputValue, setInputValue] = useState('');

  // Loading state — disables button and shows feedback
  const [loading, setLoading] = useState(false);

  // Error message shown below the input
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!inputValue.trim()) {
      setError('Please enter an account number or mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Decide whether input looks like a phone (10 digits)
      // or an account number (everything else)
      const isPhone = /^\d{10}$/.test(inputValue.trim());
      const payload  = isPhone
        ? { phone: inputValue.trim() }
        : { accountNumber: inputValue.trim().toUpperCase() };

      // Call the backend
      const response = await identifyUser(payload);

      if (response.success) {
        // Store user and accounts in global context
        setUserData(response.data.user);
        setAccounts(response.data.accounts);

        // Move to Account Selection screen
        navigate('/accounts', { replace: true });
      }

    } catch (err) {
      // Show the error message from the backend
      const message = err.response?.data?.message
        || 'Could not find user. Please check and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f4f8', gap: '16px',
    }}>

      <h2 style={{ color: '#1a3c5e', marginBottom: '4px' }}>
        Enter Account Details
      </h2>
      <p style={{ color: '#5a7a99', fontSize: '14px', margin: '0 0 12px' }}>
        Enter your 10-digit mobile number or account number
      </p>

      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setError('');   // clear error on change
        }}
        placeholder="Account No. or Mobile Number"
        style={{
          padding: '14px 20px', fontSize: '15px', borderRadius: '10px',
          border: error ? '1.5px solid #c0392b' : '1.5px solid #aac4e0',
          width: '300px', outline: 'none', fontFamily: 'Segoe UI, sans-serif',
        }}
      />

      {/* Error message */}
      {error && (
        <p style={{ color: '#c0392b', fontSize: '13px', margin: '0' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleContinue}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#8aa0b5' : '#1a3c5e',
          color: '#fff', border: 'none',
          padding: '14px 40px', fontSize: '15px',
          borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Searching...' : 'Continue'}
      </button>

      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none', border: 'none',
          color: '#4a6a8a', cursor: 'pointer', fontSize: '14px',
        }}
      >
        ← Back to Home
      </button>

    </div>
  );
}

export default FallbackPage;