// client/src/pages/FaceScanPage.jsx
// ─────────────────────────────────────────────────────────────
// Changes from previous version:
//   + After successful recognition → show confirmation UI
//   + setPendingUser/setPendingAccounts instead of setUserData
//   + YES click → confirmUser() → navigate with replace
//   + NO click  → resetSession() → back to scanning state
//   + navigate uses replace:true to prevent back-button abuse
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import axios            from 'axios';
import { useApp }       from '../context/AppContext';
import './FaceScanPage.css';

const MAX_ATTEMPTS = 3;

function FaceScanPage() {

  const navigate = useNavigate();
  const {
    setPendingUser,
    setPendingAccounts,
    confirmUser,
    resetSession,
  } = useApp();

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [attempt,        setAttempt]        = useState(1);
  const [status,         setStatus]         = useState('idle');
  const [message,        setMessage]        = useState('Position your face in the frame');
  const [cameraOn,       setCameraOn]       = useState(false);
  const [cameraError,    setCameraError]    = useState('');

  // ── NEW: confirmation state ──
  // When not null → shows "Are you [name]?" confirmation card
  const [confirming,     setConfirming]     = useState(null);
  // confirming = { name, similarity, user, accounts }

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current          = stream;
      videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (err) {
      setCameraError('Camera not accessible. Please use account number below.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const handleScan = async () => {
    if (!cameraOn || status === 'scanning') return;

    setStatus('scanning');
    setMessage('Scanning...');

    try {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      const blob = await new Promise((res) =>
        canvas.toBlob(res, 'image/jpeg', 0.9)
      );

      const formData = new FormData();
      formData.append('image', blob, 'capture.jpg');

      const response = await axios.post('/api/face/recognize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000,
      });

      const result = response.data;

      if (result.success && result.matched) {

        // ── CHANGE: don't set userData yet ──
        // Store in pending state and show confirmation
        setPendingUser(result.data.user);
        setPendingAccounts(result.data.accounts);

        // Show the "Are you X?" card
        setConfirming({
          name:       result.data.user.name,
          similarity: result.data.similarity,
          user:       result.data.user,
          accounts:   result.data.accounts,
        });

        setStatus('success');
        setMessage('');

        // Stop the camera — no longer needed
        stopCamera();

      } else {
        // Not matched — increment attempts
        const next = attempt + 1;
        if (next > MAX_ATTEMPTS) {
          setStatus('error');
          setMessage('3 attempts failed. Please use account number.');
          stopCamera();
          setTimeout(() => navigate('/fallback', { replace: false }), 1500);
        } else {
          setStatus('error');
          setMessage(result.reason || 'Not recognised. Please try again.');
          setAttempt(next);
          setTimeout(() => { setStatus('idle'); setMessage('Try again — face the camera directly.'); }, 2000);
        }
      }

    } catch (err) {
      setStatus('error');
      setMessage('Connection error. Please try again or use account number.');
      setTimeout(() => { setStatus('idle'); setMessage('Position your face in the frame.'); }, 2500);
    }
  };

  // ── User clicks YES on confirmation ──
  const handleConfirmYes = () => {
    confirmUser();          // pending → userData in context
    setConfirming(null);
    // replace: true → this page is REMOVED from history
    // pressing Back from Accounts will NOT return here
    navigate('/accounts', { replace: true });
  };

  // ── User clicks NO on confirmation ──
  const handleConfirmNo = () => {
    // Clear pending — don't set userData at all
    resetSession();
    setConfirming(null);

    // Restart camera and reset scan state
    setStatus('idle');
    setAttempt(1);
    setMessage('Position your face and try again.');
    startCamera();
  };

  const messageColor = {
    idle: '#4a6a8a', scanning: '#1a3c5e',
    success: '#1e7e34', error: '#c0392b',
  }[status];

  return (
    <div className="scan-container">

      {/* ── Top bar ── */}
      <div className="scan-topbar">
        <button className="back-btn" onClick={() => { stopCamera(); navigate('/'); }}>
          ← Back
        </button>
        <h2 className="scan-title">Face Scan</h2>
        <div style={{ width: '70px' }} />
      </div>

      {/* ── CONFIRMATION CARD — shown after successful recognition ── */}
      {confirming && (
        <div style={{
          width:           '100%',
          maxWidth:        '400px',
          backgroundColor: '#ffffff',
          border:          '2px solid #1a3c5e',
          borderRadius:    '16px',
          padding:         '28px 24px',
          textAlign:       'center',
          boxShadow:       '0 6px 24px rgba(26,60,94,0.15)',
          marginTop:       '16px',
        }}>

          {/* Face check icon */}
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>

          {/* Recognition result */}
          <p style={{ color: '#4a6a8a', fontSize: '14px', margin: '0 0 6px' }}>
            We recognized:
          </p>
          <h2 style={{ color: '#1a3c5e', fontSize: '24px',
            margin: '0 0 6px', fontFamily: 'Segoe UI, sans-serif' }}>
            {confirming.name}
          </h2>
          <p style={{ color: '#7a95ae', fontSize: '12px', margin: '0 0 24px' }}>
            Confidence: {(confirming.similarity * 100).toFixed(1)}%
          </p>

          {/* The confirmation question */}
          <p style={{ color: '#1a3c5e', fontSize: '16px',
            fontWeight: 700, margin: '0 0 24px' }}>
            Is this you?
          </p>

          {/* YES / NO buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>

            <button
              onClick={handleConfirmNo}
              style={{
                flex:         1,
                padding:      '14px',
                border:       '2px solid #1a3c5e',
                borderRadius: '10px',
                background:   '#ffffff',
                color:        '#1a3c5e',
                fontSize:     '16px',
                fontWeight:   '700',
                cursor:       'pointer',
              }}
            >
              No
            </button>

            <button
              onClick={handleConfirmYes}
              style={{
                flex:         1,
                padding:      '14px',
                border:       'none',
                borderRadius: '10px',
                background:   '#1a3c5e',
                color:        '#ffffff',
                fontSize:     '16px',
                fontWeight:   '700',
                cursor:       'pointer',
              }}
            >
              Yes, that's me
            </button>

          </div>

          {/* Safety note */}
          <p style={{ color: '#9aafbf', fontSize: '11px', marginTop: '16px', lineHeight: 1.4 }}>
            If this is not you, tap No. Your details will not be accessed.
          </p>

        </div>
      )}

      {/* ── Camera viewfinder — hidden during confirmation ── */}
      {!confirming && (
        <>
          <div className="scan-viewfinder-wrapper">
            <div className="scan-viewfinder">
              <div className="corner top-left" /><div className="corner top-right" />
              <div className="corner bottom-left" /><div className="corner bottom-right" />

              <video
                ref={videoRef}
                autoPlay playsInline muted
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  borderRadius: '18px', transform: 'scaleX(-1)',
                  display: cameraError ? 'none' : 'block',
                }}
              />
              {(!cameraOn || cameraError) && (
                <div className="scan-face-icon">👤</div>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {cameraError && (
            <p style={{ color: '#c0392b', fontSize: '13px',
              maxWidth: '320px', textAlign: 'center' }}>
              {cameraError}
            </p>
          )}

          <p className="scan-instruction" style={{ color: messageColor }}>
            {message}
          </p>

          <div className="attempt-section">
            <span className="attempt-label">Attempt {attempt} of {MAX_ATTEMPTS}</span>
            <div className="attempt-dots">
              {[1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={`dot ${dot <= attempt ? 'dot-filled' : 'dot-empty'}`}
                  style={
                    dot === attempt && status === 'error'
                      ? { backgroundColor: '#c0392b' } : {}
                  }
                />
              ))}
            </div>
          </div>

          <button
            className="scan-btn"
            onClick={handleScan}
            disabled={status === 'scanning' || !!cameraError}
            style={{
              opacity:         status === 'scanning' || cameraError ? 0.6 : 1,
              cursor:          status === 'scanning' || cameraError ? 'not-allowed' : 'pointer',
              backgroundColor: status === 'error' ? '#c0392b' : '#1a3c5e',
            }}
          >
            {status === 'scanning' ? 'Scanning...' : 'Scan Face'}
          </button>

          <div className="divider"><span>or</span></div>

          <button
            className="fallback-link"
            onClick={() => { stopCamera(); navigate('/fallback'); }}
          >
            Use Account Number Instead
          </button>
        </>
      )}

    </div>
  );
}

export default FaceScanPage;