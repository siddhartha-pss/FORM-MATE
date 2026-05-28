// client/src/pages/onboarding/ConfirmDetailsPage.jsx
// ─────────────────────────────────────────────────────────────
// Step 3 — Shows OCR-extracted data in editable fields.
//
// KEY FIX:
//   Form state is initialised directly from extractedData in
//   OnboardingContext at mount time. No hardcoded values.
//   User can edit any field before saving.
//
// DEBUGGING:
//   Console logs show exactly what arrived from OCR so you
//   can verify the pipeline end-to-end.
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate }                from 'react-router-dom';
import axios                          from 'axios';
import { useOnboarding }              from '../../context/OnboardingContext';

function ConfirmDetailsPage() {

  const navigate = useNavigate();
  const {
    accountType,
    extractedData,
    setConfirmedData,
    setNewUserId,
    setSubjectName,
    resetOnboarding,
  } = useOnboarding();

  // ── CRITICAL FIX: initialise directly from context ──
  // Do NOT use empty defaults here — use extractedData directly.
  // This ensures OCR output appears in the form immediately.
  const [formData, setFormData] = useState(() => {
    // This function runs ONCE on mount using the current extractedData
    console.log('[ConfirmDetails] Initialising form from extractedData:', extractedData);

    return {
      name:    extractedData.name    || '',
      dob:     extractedData.dob     || '',
      gender:  extractedData.gender  || '',
      aadhaar: extractedData.aadhaar || '',
      pan:     extractedData.pan     || '',
      phone:   '',   // not from OCR — user must enter
      email:   '',   // not from OCR — optional
      address: {
        line1:   extractedData.address?.line1   || '',
        city:    extractedData.address?.city    || '',
        state:   extractedData.address?.state   || '',
        pincode: extractedData.address?.pincode || '',
      },
    };
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Debug: log extractedData when it changes ──
  // Remove these logs after confirming data flow is correct
  useEffect(() => {
    console.log('[ConfirmDetails] extractedData in context:', extractedData);
    console.log('[ConfirmDetails] formData state:', formData);
  }, []);

  // ── Field change handlers ──
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  // ── Save to MongoDB ──
  const handleSave = async () => {
    // Validate minimum required fields
    if (!formData.name || !formData.phone || !formData.aadhaar) {
      setError('Name, phone number, and Aadhaar number are required.');
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[ConfirmDetails] Saving user to MongoDB:', formData);

      const payload = {
        ...formData,
        accountType,
        // Convert DOB string to ISO format if needed
        dob: formData.dob ? new Date(formData.dob).toISOString() : null,
      };

      const response = await axios.post('/api/onboarding/register', payload);
      console.log('[ConfirmDetails] Register response:', response.data);

      if (response.data.success) {
        // Store userId and subject name for face registration step
        setNewUserId(response.data.userId);
        setSubjectName(response.data.subjectName);
        setConfirmedData(formData);
        navigate('/new-user/face-capture', { replace: true });
      } else {
        setError(response.data.message || 'Could not save your details. Please try again.');
      }

    } catch (err) {
      console.error('[ConfirmDetails] Save error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reusable field renderer ──
  const renderField = (label, field, type = 'text', required = false, readOnlyHint = '') => (
    <div key={field} style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '5px' }}>
        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1a3c5e' }}>
          {label}{required && <span style={{ color: '#e74c3c' }}> *</span>}
        </label>
        {/* Show "from OCR" badge on auto-filled fields */}
        {formData[field] && readOnlyHint && (
          <span style={{
            fontSize:        '11px',
            backgroundColor: '#d6eaf8',
            color:           '#1a5a8e',
            border:          '1px solid #aac4e0',
            borderRadius:    '20px',
            padding:         '1px 8px',
          }}>
            {readOnlyHint}
          </span>
        )}
      </div>
      <input
        type={type}
        value={formData[field] || ''}
        onChange={(e) => handleChange(field, e.target.value)}
        style={{
          width:           '100%',
          padding:         '12px 14px',
          fontSize:        '14px',
          border:          `1.5px solid ${formData[field] ? '#1a3c5e' : '#c0d4e8'}`,
          borderRadius:    '10px',
          backgroundColor: formData[field] ? '#eaf2fb' : '#ffffff',
          outline:         'none',
          boxSizing:       'border-box',
          fontFamily:      'Segoe UI, sans-serif',
          color:           '#1a3c5e',
          transition:      'border-color 0.2s, background-color 0.2s',
        }}
        placeholder={required ? `Enter ${label.toLowerCase()}` : `${label} (optional)`}
      />
    </div>
  );

  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: '#f0f4f8',
      fontFamily:      'Segoe UI, sans-serif',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      padding:         '0 20px 60px',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        width:          '100%',
        maxWidth:       '520px',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        '24px 0 8px',
      }}>
        <button
          onClick={() => navigate('/new-user/documents')}
          style={{ background: 'none', border: 'none', color: '#1a3c5e',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, color: '#1a3c5e', fontSize: '20px', fontWeight: 700 }}>
          Confirm Details
        </h2>
        <button
          onClick={() => { resetOnboarding(); navigate('/', { replace: true }); }}
          style={{ background: 'none', border: '1.5px solid #e74c3c',
            color: '#e74c3c', padding: '6px 14px', borderRadius: '8px',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          ✕ Cancel
        </button>
      </div>

      {/* ── Info banner ── */}
      <div style={{
        backgroundColor: '#eaf2fb',
        border:          '1px solid #aac4e0',
        borderRadius:    '10px',
        padding:         '12px 16px',
        marginBottom:    '20px',
        width:           '100%',
        maxWidth:        '480px',
        boxSizing:       'border-box',
        fontSize:        '13px',
        color:           '#1a3c5e',
      }}>
        <strong>📝 Review your details.</strong> Fields with a blue background were
        extracted from your documents. Edit anything that looks incorrect.
      </div>

      {/* ── OCR Debug panel (visible in development) ──
          Remove this block after confirming OCR data is correct */}
      {process.env.NODE_ENV === 'development' && (
        <details style={{
          width:           '100%',
          maxWidth:        '480px',
          marginBottom:    '16px',
          backgroundColor: '#f8f4ff',
          border:          '1px solid #c4a8e0',
          borderRadius:    '8px',
          padding:         '10px 14px',
          fontSize:        '12px',
          boxSizing:       'border-box',
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#6a1b9a' }}>
            🔍 Debug: Raw OCR data (click to expand)
          </summary>
          <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap',
            color: '#4a276e', fontSize: '11px' }}>
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </details>
      )}

      {/* ── Form ── */}
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Personal details */}
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#7a95ae',
          margin: '0 0 14px', letterSpacing: '0.5px' }}>
          PERSONAL DETAILS
        </p>

        {renderField('Full Name',      'name',    'text', true,  'From Aadhaar')}
        {renderField('Date of Birth',  'dob',     'text', true,  'From Aadhaar')}
        {renderField('Gender',         'gender',  'text', false, 'From Aadhaar')}
        {renderField('Aadhaar Number', 'aadhaar', 'text', true,  'From Aadhaar')}
        {renderField('PAN Number',     'pan',     'text', false, 'From PAN')}

        {/* Contact — user must fill */}
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#7a95ae',
          margin: '20px 0 14px', letterSpacing: '0.5px' }}>
          CONTACT DETAILS
        </p>

        {renderField('Mobile Number', 'phone', 'tel',   true,  '')}
        {renderField('Email Address', 'email', 'email', false, '')}

        {/* Address */}
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#7a95ae',
          margin: '20px 0 14px', letterSpacing: '0.5px' }}>
          ADDRESS
        </p>

        {/* Address fields use handleAddressChange */}
        {[
          { label: 'Address Line 1', key: 'line1'   },
          { label: 'City',           key: 'city'    },
          { label: 'State',          key: 'state'   },
          { label: 'Pincode',        key: 'pincode' },
        ].map(({ label, key }) => (
          <div key={key} style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1a3c5e' }}>
                {label}
              </label>
              {formData.address[key] && (
                <span style={{
                  fontSize: '11px', backgroundColor: '#d6eaf8', color: '#1a5a8e',
                  border: '1px solid #aac4e0', borderRadius: '20px', padding: '1px 8px',
                }}>
                  From Aadhaar
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.address[key] || ''}
              onChange={(e) => handleAddressChange(key, e.target.value)}
              style={{
                width:           '100%',
                padding:         '12px 14px',
                fontSize:        '14px',
                border:          `1.5px solid ${formData.address[key] ? '#1a3c5e' : '#c0d4e8'}`,
                borderRadius:    '10px',
                backgroundColor: formData.address[key] ? '#eaf2fb' : '#ffffff',
                outline:         'none',
                boxSizing:       'border-box',
                fontFamily:      'Segoe UI, sans-serif',
                color:           '#1a3c5e',
              }}
              placeholder={label}
            />
          </div>
        ))}

        {/* Error */}
        {error && (
          <p style={{ color: '#c0392b', fontSize: '13px',
            textAlign: 'center', margin: '8px 0 16px' }}>
            {error}
          </p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            width:           '100%',
            padding:         '16px',
            fontSize:        '16px',
            fontWeight:      700,
            border:          'none',
            borderRadius:    '12px',
            backgroundColor: loading ? '#8aa0b5' : '#1a3c5e',
            color:           '#ffffff',
            cursor:          loading ? 'not-allowed' : 'pointer',
            marginTop:       '8px',
          }}
        >
          {loading ? '⏳ Saving...' : 'Save & Continue to Face Registration →'}
        </button>

      </div>
    </div>
  );
}

export default ConfirmDetailsPage;