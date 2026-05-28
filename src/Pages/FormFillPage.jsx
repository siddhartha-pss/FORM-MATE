// client/src/pages/FormFillPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate }                from 'react-router-dom';
import { useApp }                     from '../context/AppContext';
import useSessionGuard                 from '../hooks/useSessionGuard';
import CancelButton                    from '../components/CancelButton';
import { fillForm, submitForm }       from '../services/api';
import './FormFillPage.css';
import KYCBanner from '../components/KYCBanner';
import { generateFormPDF } from '../utils/generatePDF';

function FormFillPage() {

  const navigate = useNavigate();
  const {
    userData,
    selectedAccount,
    selectedForm,
    resetSession,
  } = useApp();

  const hasSession = useSessionGuard();
  if (!hasSession) return null;

  const [view, setView]           = useState('fill');
  const [fields, setFields]       = useState([]);
  const [formName, setFormName]   = useState('');
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Fetch filled form from the form engine ──
  useEffect(() => {
    const fetchFilledForm = async () => {
      if (!selectedForm || !userData || !selectedAccount) return;

      try {
        setLoading(true);
        const response = await fillForm(
          selectedForm.formId,
          userData._id,
          selectedAccount._id,
        );

        if (response.success) {
          setFormName(response.data.formName);
          setFields(response.data.fields);

          // Pre-populate formValues with auto-filled values
          const initialValues = {};
          response.data.fields.forEach((field) => {
            initialValues[field.fieldId] = field.value || '';
          });
          setFormValues(initialValues);
        }
      } catch (err) {
        setError('Could not load form. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFilledForm();
  }, [selectedForm, userData, selectedAccount]);

  const handleChange = (fieldId, value) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  // ── Submit the completed form ──
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await submitForm({
        userId:        userData._id,
        accountId:     selectedAccount._id,
        formType:      selectedForm.formId,
        submittedData: formValues,
      });

      if (response.success) {
        setSubmitSuccess(true);
        setView('success');
        return;
      }

      setError(response.message || 'Submission failed. Please try again.');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Submission failed. Please try again.';

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    generateFormPDF({
      formName:      formName,
      fields:        fields.map((field) => ({
        label:      field.label,
        value:      formValues[field.fieldId] || '',
        autoFilled: field.autoFilled,
        type:       field.type,
      })),
      userName:      userData?.name      || '',
      accountNumber: selectedAccount?.accountNumber || '',
    });
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Segoe UI, sans-serif', color: '#4a6a8a',
      }}>
        Loading your form...
      </div>
    );
  }

  // ── Success view after submission ──
  if (view === 'success') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f4f8', gap: '16px',
      }}>
        <div style={{ fontSize: '64px' }}>✅</div>
        <h2 style={{ color: '#1a3c5e', margin: 0 }}>Form Submitted!</h2>
        <p style={{ color: '#4a6a8a', textAlign: 'center', maxWidth: '320px' }}>
          Your <strong>{formName}</strong> has been submitted successfully.
          Please collect your acknowledgement from the counter.
        </p>
        <button
          onClick={() => { resetSession(); navigate('/', { replace: true }); }}
          style={{
            backgroundColor: '#1a3c5e', color: '#fff', border: 'none',
            padding: '14px 36px', fontSize: '15px', borderRadius: '10px',
            cursor: 'pointer', marginTop: '8px',
          }}
        >
          ↩ Start Over
        </button>
      </div>
    );
  }

  // ── Fill view ──
  if (view === 'fill') {
    return (
      <div className="formfill-container">
        <div className="formfill-topbar">
          <button className="back-btn" onClick={() => navigate('/form-select')}>
            ← Back
          </button>
          <h2 className="formfill-title">{formName}</h2>
          <CancelButton label="✕ Cancel" />
        </div>

        <div className="legend">
          <span className="legend-item">
            <span className="dot-autofill" /> Auto-filled
          </span>
          <span className="legend-item">
            <span className="dot-manual" /> Fill manually
          </span>
        </div>

        {error && (
          <p style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>
        )}

        {/* KYC reminder — compact version */}
        {userData?.kycStatus !== 'complete' && (
          <div style={{ width: '100%', maxWidth: '480px', padding: '0 20px',
            boxSizing: 'border-box', marginBottom: '4px' }}>
            <KYCBanner kycStatus={userData?.kycStatus} />
          </div>
        )}

        <div className="form-body">
          {fields.map((field) => (
            <div key={field.fieldId} className="form-field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor={field.fieldId}>
                  {field.label}
                  {field.required && <span className="required-star"> *</span>}
                </label>
                {field.autoFilled && (
                  <span className="autofill-badge">Auto</span>
                )}
              </div>

              {field.type === 'signature' && (
                <div className="signature-box">
                  <span className="signature-placeholder">Sign here</span>
                  <span className="signature-note">Physical signature required</span>
                </div>
              )}

              {field.type === 'select' && (
                <select
                  id={field.fieldId}
                  className="form-input form-select"
                  value={formValues[field.fieldId] || ''}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === 'date' && (
                <input
                  id={field.fieldId}
                  type="date"
                  className="form-input"
                  value={formValues[field.fieldId] || ''}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                />
              )}

              {(field.type === 'text' || field.type === 'textarea') && (
                <input
                  id={field.fieldId}
                  type="text"
                  className={`form-input ${field.autoFilled ? 'input-autofill' : ''}`}
                  placeholder={field.placeholder || ''}
                  value={formValues[field.fieldId] || ''}
                  onChange={(e) => handleChange(field.fieldId, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <button className="preview-btn" onClick={() => setView('preview')}>
          Preview Form →
        </button>
      </div>
    );
  }

  // ── Preview view ──
  if (view === 'preview') {
    return (
      <div className="formfill-container">
        <div className="formfill-topbar">
          <button className="back-btn" onClick={() => setView('fill')}>
            ← Edit
          </button>
          <h2 className="formfill-title">Preview</h2>
          <div style={{ width: '70px' }} />
        </div>

        <p className="preview-subheading">
          Review your form before submitting.
        </p>

        <div className="preview-card" id="form-preview">
          <div className="preview-form-header">
            <div className="preview-bank-name">SmartBank</div>
            <h3 className="preview-form-title">
              {formName.toUpperCase()}
            </h3>
            <div className="preview-divider-line" />
          </div>

          <div className="preview-fields">
            {fields.map((field) => (
              <div key={field.fieldId} className="preview-row">
                <span className="preview-field-label">{field.label}</span>
                <span className="preview-field-colon">:</span>
                {field.type === 'signature' ? (
                  <span className="preview-field-value preview-signature-placeholder">
                    ___________________________
                  </span>
                ) : (
                  <span className={`preview-field-value ${!formValues[field.fieldId] ? 'preview-empty' : ''}`}>
                    {formValues[field.fieldId] || '——'}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="preview-form-footer">
            <div className="preview-footer-col">
              <div className="preview-footer-line" />
              <span className="preview-footer-label">Customer Signature</span>
            </div>
            <div className="preview-footer-col">
              <div className="preview-footer-line" />
              <span className="preview-footer-label">Bank Official</span>
            </div>
          </div>
        </div>

        <div className="preview-actions">
          <button className="action-btn btn-edit" onClick={() => setView('fill')}>
            ← Back to Edit
          </button>
          <button className="action-btn btn-download" onClick={handleDownload}>
            ⬇ Download PDF
          </button>
          <button
            className="action-btn btn-print"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ backgroundColor: submitting ? '#8aa0b5' : '' }}
          >
            {submitting ? 'Submitting...' : '✔ Submit Form'}
          </button>
        </div>

        {error && (
          <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '12px' }}>
            {error}
          </p>
        )}

        <button
          className="start-over-link"
          onClick={() => { resetSession(); navigate('/'); }}
        >
          ↩ Start Over
        </button>
      </div>
    );
  }
}

export default FormFillPage;