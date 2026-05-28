// client/src/pages/FormSelectionPage.jsx
// Phase 4 update — Speech-to-Text wired in

import React, { useState, useEffect }    from 'react';
import { useNavigate }                   from 'react-router-dom';
import { useApp }                        from '../context/AppContext';
import { getAllForms }                   from '../services/api';
import useSpeechRecognition              from '../hooks/useSpeechRecognition';
import useSessionGuard                   from '../hooks/useSessionGuard';
import CancelButton                      from '../components/CancelButton';
import { matchFormFromSpeech }           from '../utils/matchFormFromSpeech';
import { isSpeechSupported }             from '../utils/speechSupport';
import './FormSelectionPage.css';

const FORM_ICONS = {
  cheque_book_request: '📋',
  address_change:      '📮',
  account_statement:   '📄',
  fd_opening:          '💰',
  neft_rtgs:           '🔄',
};

function FormSelectionPage() {

  const navigate = useNavigate();
  const { selectedAccount, setSelectedForm } = useApp();
  const hasSession = useSessionGuard();
  if (!hasSession) return null;

  // ── Data state ──
  const [forms,          setForms]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [selectedFormId, setSelectedFormId] = useState(null);

  // ── STT hook ──
  const {
    isListening,
    transcript,
    confidence,
    error:       sttError,
    startListening,
    stopListening,
    resetTranscript,
    mode,
    isSupported: sttSupported,
  } = useSpeechRecognition();

  // ── Fetch forms from backend ──
  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const response = await getAllForms(selectedAccount?.accountType || '');
        if (response.success) setForms(response.data);
      } catch {
        setError('Could not load forms. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, [selectedAccount]);

  // ── Auto-match form when transcript updates ──
  // This effect runs every time the transcript changes.
  // As soon as a keyword match is found, the form auto-selects.
  useEffect(() => {
    if (!transcript || forms.length === 0) return;

    const matched = matchFormFromSpeech(transcript, forms);

    if (matched) {
      // Form matched — auto-select it
      setSelectedFormId(matched.formId);

      // Stop listening — we found what we needed
      stopListening();
    }
  }, [transcript, forms, stopListening]);

  // ── Mic button handler ──
  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setSelectedFormId(null);   // clear previous selection when mic starts
      startListening();
    }
  };

  // ── Card click ──
  const handleCardSelect = (formId) => {
    setSelectedFormId(formId);
    if (isListening) stopListening();
    resetTranscript();
  };

  // ── Continue ──
  const handleContinue = () => {
    if (!selectedFormId) return;
    const form = forms.find((f) => f.formId === selectedFormId);
    setSelectedForm(form);
    navigate('/form-fill', { replace: true });
  };

  const micLabel = {
    'idle':        'Tap & say the form name',
    'browser-stt': 'Listening... (speak now)',
    'recording':   '🔴 Recording... (5 seconds)',
    'uploading':   '⏳ Processing your voice...',
  }[mode] || 'Tap & say the form name';

  // ── Status message shown below mic button ──
  // Priority: sttError > transcript > instructions
  const getStatusContent = () => {
    if (sttError) {
      return { text: sttError, color: '#c0392b', icon: '⚠️' };
    }
    if (isListening && !transcript) {
      return { text: 'Speak now — say a form name...', color: '#4a6a8a', icon: '🎙️' };
    }
    if (transcript && !selectedFormId) {
      return {
        text:  `Heard: "${transcript}" — no form matched. Try again.`,
        color: '#e65100',
        icon:  '🔍',
      };
    }
    if (transcript && selectedFormId) {
      const name = forms.find((f) => f.formId === selectedFormId)?.formName;
      return {
        text:  `Matched: "${name}"`,
        color: '#1e7e34',
        icon:  '✅',
      };
    }
    return null;
  };

  const statusContent = getStatusContent();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Segoe UI, sans-serif', color: '#4a6a8a',
      }}>
        Loading available forms...
      </div>
    );
  }

  return (
    <div className="formsel-container">

      {/* ── Top bar ── */}
      <div className="formsel-topbar">
        <button className="back-btn" onClick={() => navigate('/accounts')}>
          ← Back
        </button>
        <h2 className="formsel-title">Select Form</h2>
        <CancelButton label="✕ Cancel" />
      </div>

      <p className="formsel-heading">What would you like to do today?</p>

      {error && (
        <p style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>
      )}

      {/* ── Voice Section ── */}
      <div className="voice-section">

        {/* ── Mic Button ── */}
        <button
          className={`mic-btn ${isListening ? 'mic-active' : ''}`}
          onClick={handleMicToggle}
          // Disable if browser doesn't support STT
          disabled={!sttSupported}
          title={
            !sttSupported
              ? 'Speech recognition requires Chrome browser'
              : isListening
              ? 'Tap to stop listening'
              : 'Tap to speak'
          }
          style={{ opacity: sttSupported ? 1 : 0.5 }}
        >
          <span className="mic-icon">🎤</span>
          <span className="mic-label">{micLabel}</span>
          {isListening && <span className="mic-pulse" />}
        </button>

        {/* ── Browser not supported warning ── */}
        {!sttSupported && (
          <p style={{
            fontSize: '12px', color: '#888', textAlign: 'center',
            margin: '6px 0 0', maxWidth: '320px',
          }}>
            Voice input requires Chrome browser. Use the cards below instead.
          </p>
        )}

        {/* ── Live transcript + status box ── */}
        {sttSupported && (isListening || transcript || sttError) && (
          <div style={{
            width:           '100%',
            backgroundColor: statusContent?.color === '#1e7e34' ? '#f0fff4' : '#ffffff',
            border:          `1.5px ${statusContent?.color === '#1e7e34' ? 'solid' : 'dashed'} ${statusContent?.color || '#aac4e0'}`,
            borderRadius:    '10px',
            padding:         '14px 18px',
            minHeight:       '52px',
            display:         'flex',
            alignItems:      'center',
            gap:             '10px',
            transition:      'border-color 0.3s, background-color 0.3s',
          }}>
            {statusContent && (
              <>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>
                  {statusContent.icon}
                </span>
                <span style={{
                  fontSize:   '13px',
                  color:      statusContent.color,
                  fontStyle:  transcript && !selectedFormId ? 'normal' : 'italic',
                  lineHeight: 1.4,
                }}>
                  {statusContent.text}
                  {/* Show confidence score if available */}
                  {confidence > 0 && selectedFormId && (
                    <span style={{ opacity: 0.6, marginLeft: '8px', fontSize: '11px' }}>
                      ({(confidence * 100).toFixed(0)}% confidence)
                    </span>
                  )}
                </span>
              </>
            )}

            {/* Animated dots while listening */}
            {isListening && !transcript && (
              <span style={{ color: '#4a6a8a', fontSize: '13px' }}>
                <span className="listening-dots">●●●</span>
              </span>
            )}
          </div>
        )}

        {/* ── Keyword hints — shown when mic is active ── */}
        {isListening && (
          <div style={{
            backgroundColor: '#f0f4f8',
            borderRadius:    '10px',
            padding:         '12px 16px',
            width:           '100%',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px',
              fontWeight: 700, color: '#4a6a8a' }}>
              Try saying:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                '"cheque book"',
                '"address change"',
                '"account statement"',
                '"fixed deposit"',
                '"NEFT transfer"',
              ].map((hint) => (
                <span
                  key={hint}
                  style={{
                    backgroundColor: '#ffffff',
                    border:          '1px solid #c0d4e8',
                    borderRadius:    '20px',
                    padding:         '3px 10px',
                    fontSize:        '12px',
                    color:           '#1a3c5e',
                  }}
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Divider ── */}
      <div className="divider"><span>or choose below</span></div>

      {/* ── Form cards grid — real data from backend ── */}
      <div className="formsel-grid">
        {forms.map((form) => {
          const isSelected = selectedFormId === form.formId;
          return (
            <div
              key={form.formId}
              className={`form-card ${isSelected ? 'form-card-selected' : ''}`}
              onClick={() => handleCardSelect(form.formId)}
            >
              <div className="form-card-icon">
                {FORM_ICONS[form.formId] || '📝'}
              </div>
              <p className="form-card-title">{form.formName}</p>
              <p className="form-card-desc">{form.description}</p>
              {isSelected && <div className="form-card-badge">✓</div>}
            </div>
          );
        })}
      </div>

      {/* ── Selected form confirmation ── */}
      {selectedFormId && (
        <div className="selected-summary">
          <span className="selected-summary-text">
            Selected:&nbsp;
            <strong>
              {forms.find((f) => f.formId === selectedFormId)?.formName}
            </strong>
          </span>
        </div>
      )}

      {/* ── Continue button ── */}
      <button
        className={`continue-btn ${selectedFormId ? 'active' : 'disabled'}`}
        onClick={handleContinue}
        disabled={!selectedFormId}
      >
        Continue →
      </button>

      {!selectedFormId && (
        <p className="formsel-hint">
          Speak into the mic or tap a form card above.
        </p>
      )}

    </div>
  );
}

export default FormSelectionPage;