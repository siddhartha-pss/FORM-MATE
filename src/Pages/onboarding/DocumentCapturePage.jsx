// client/src/pages/onboarding/DocumentCapturePage.jsx
// ─────────────────────────────────────────────────────────────
// Replaces DocumentUploadPage.jsx entirely.
//
// Step-based camera capture:
//   Step 0 → instructions screen
//   Step 1 → capture Aadhaar Front
//   Step 2 → capture Aadhaar Back
//   Step 3 → capture PAN card
//   Step 4 → prepare confirmation screen
//
// Per document:
//   cameraState: 'idle' → 'live' → 'captured' → next step
//
// Camera lifecycle rules:
//   - Stream starts only when user clicks "Open Camera"
//   - Stream stops IMMEDIATELY after user confirms capture
//   - Stream stops on component unmount (cleanup)
//   - Before opening new stream → always stop old stream first
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate }   from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import BackButton        from '../../components/BackButton';
import OnboardingProgress from '../../components/OnboardingProgress';
import { runOCR } from '../../utils/ocrApi';

// ── Document steps ──
const STEPS = [
  {
    id:      'aadhaarFront',
    label:   'Aadhaar Card — Front',
    icon:    '🪪',
    hint:    'Show the front side with your photo, name, DOB and Aadhaar number.',
    tip:     'Hold card flat. Ensure all 4 corners are visible in the frame.',
  },
  {
    id:      'aadhaarBack',
    label:   'Aadhaar Card — Back',
    icon:    '🪪',
    hint:    'Show the back side with your registered address.',
    tip:     'Make sure the address text is sharp and not blurred.',
  },
  {
    id:      'pan',
    label:   'PAN Card',
    icon:    '📋',
    hint:    'Show your PAN card with name, PAN number and date of birth.',
    tip:     'Avoid glare. Place card on a dark surface for best contrast.',
  },
];

const OCR_ENDPOINTS = {
  aadhaarFront: 'aadhaar-front',
  aadhaarBack: 'aadhaar-back',
  pan: 'pan',
};

// ── Helper: stop a MediaStream safely ──
const stopStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
      console.log(`[Camera] Stopped track: ${track.kind}`);
    });
  }
};

function DocumentCapturePage() {

  const navigate = useNavigate();
  const { accountType, setExtractedData, resetOnboarding } = useOnboarding();

  // ── Camera refs ──
  const videoRef  = useRef(null);    // <video> element
  const canvasRef = useRef(null);    // hidden <canvas> for frame capture
  const streamRef = useRef(null);    // active MediaStream — MUST stop before new stream

  // ── Step tracking ──
  // stepIndex: 0 = intro, 1 = aadhaarFront, 2 = aadhaarBack, 3 = pan, 4 = confirm
  const [stepIndex,    setStepIndex]    = useState(0);
  const [cameraState,  setCameraState]  = useState('idle');
  // cameraState: 'idle' | 'opening' | 'live' | 'captured'

  // ── Captured images ──
  const [capturedBlobs,      setCapturedBlobs]      = useState({});  // { aadhaarFront: Blob, ... }
  const [capturedPreviews,   setCapturedPreviews]   = useState({});  // { aadhaarFront: dataURL, ... }
  const [capturedBase64s,    setCapturedBase64s]    = useState({});  // { aadhaarFront: dataURL, ... }

  // ── UI state ──
  const [error, setError] = useState('');

  // ── Cleanup camera on unmount ──
  // This is the KEY fix for Issue 3 — ensures camera stops when navigating away
  useEffect(() => {
    return () => {
      console.log('[DocumentCapture] Unmounting — stopping camera stream');
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const currentStep = STEPS[stepIndex - 1];  // null on intro (stepIndex 0)

  // ── Open camera for current step ──
  const openCamera = useCallback(async () => {
    setError('');
    setCameraState('opening');

    // ALWAYS stop any existing stream before opening a new one
    stopStream(streamRef.current);
    streamRef.current = null;

    // Detach old stream from video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:      { ideal: 1280 },
          height:     { ideal: 720 },
          facingMode: 'environment',  // rear camera for documents (better quality)
        },
        audio: false,
      });

      streamRef.current          = stream;
      videoRef.current.srcObject = stream;
      setCameraState('live');
      console.log(`[Camera] Opened for step: ${currentStep?.id}`);

    } catch (err) {
      setCameraState('idle');
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Allow camera access in browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure a camera is connected.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, [currentStep]);

  // ── Capture current video frame ──
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    // Draw current frame to canvas
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const stepId = currentStep.id;
    const ocrKey = OCR_ENDPOINTS[stepId];
    const previewUrl = canvas.toDataURL('image/jpeg', 0.92);

    canvas.toBlob((blob) => {
      setCapturedBlobs((prev)    => ({ ...prev, [stepId]: blob }));
      setCapturedPreviews((prev) => ({ ...prev, [stepId]: previewUrl }));
      setCapturedBase64s((prev)  => ({ ...prev, [ocrKey]: previewUrl }));
      setCameraState('captured');

      // STOP CAMERA immediately after capture — don't leave it running
      stopStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;

      console.log(`[Camera] Captured and stopped for: ${stepId}`);
    }, 'image/jpeg', 0.92);
  }, [currentStep]);

  // ── Retake — clear capture and reopen camera ──
  const handleRetake = () => {
    const stepId = currentStep.id;
    setCapturedBlobs((prev)    => { const n = { ...prev }; delete n[stepId]; return n; });
    setCapturedPreviews((prev) => { const n = { ...prev }; delete n[stepId]; return n; });
    setCapturedBase64s((prev)  => { const n = { ...prev }; delete n[stepId]; return n; });
    setCameraState('idle');
  };

  // ── Confirm capture and move to next document ──
  const handleConfirm = () => {
    const nextIndex = stepIndex + 1;

    if (nextIndex <= STEPS.length) {
      // More documents to capture
      setStepIndex(nextIndex);
      setCameraState('idle');
    } else {
      // All documents captured — run OCR
      handleExtractOCR();
    }
  };

  // ── Continue to manual confirmation ──
  const handleExtractOCR = async () => {
    setStepIndex(4);
    setError('');

    try {
      const aadhaarFrontImage = capturedBase64s['aadhaar-front'];
      const aadhaarBackImage = capturedBase64s['aadhaar-back'];
      const panImage = capturedBase64s.pan;

      if (!aadhaarFrontImage || !aadhaarBackImage || !panImage) {
        throw new Error('One or more document images are missing. Please retake the captures.');
      }

      const [aadhaarFront, aadhaarBack, pan] = await Promise.all([
        runOCR('aadhaar-front', aadhaarFrontImage),
        runOCR('aadhaar-back', aadhaarBackImage),
        runOCR('pan', panImage),
      ]);

      const mergedData = {
        name: aadhaarFront.parsed.fullName || pan.parsed.fullName || '',
        dob: aadhaarFront.parsed.dob || pan.parsed.dob || '',
        gender: aadhaarFront.parsed.gender || '',
        aadhaar: aadhaarFront.parsed.aadhaarNumber || '',
        pan: pan.parsed.panNumber || '',
        address: {
          line1: aadhaarBack.parsed.address || '',
          city: '',
          state: '',
          pincode: aadhaarBack.parsed.pincode || '',
        },
      };

      setExtractedData(mergedData);
      navigate('/new-user/confirm', { replace: true });
    } catch (err) {
      setError(err.message || 'OCR failed. Please retake the images and try again.');
      setStepIndex(3);
    }
  };

  const handleCancel = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    resetOnboarding();
    navigate('/', { replace: true });
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: '#120f17',
      fontFamily:      'Segoe UI, sans-serif',
      display:         'flex',
      flexDirection:   'column',
      justifyContent:  'space-between',
      alignItems:      'center',
      padding:         '24px 20px 48px',
      color:           '#f0efee',
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
        <BackButton
          label="← Back"
          onClick={() => {
            stopStream(streamRef.current);
            navigate('/new-user');
          }}
        />
        <h2 style={{ margin: 0, color: '#f0efee', fontSize: '20px', fontWeight: 700 }}>
          {stepIndex === 0 ? 'Scan Documents' : currentStep?.label || 'Extracting...'}
        </h2>
        <button onClick={handleCancel} style={{
          background: 'none', border: '1.5px solid #ef4444', color: '#ef4444',
          padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
          fontWeight: 700, cursor: 'pointer',
        }}>
          ✕ Cancel
        </button>
      </div>

      <div style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        alignItems:     'center',
        width:          '100%',
        gap:            '22px',
      }}>
        <OnboardingProgress activeStepIndex={1} />

        {/* ── Progress dots ── */}
      <div style={{ display: 'flex', gap: '10px', margin: '12px 0 24px' }}>
        {STEPS.map((step, i) => {
          const done    = Object.keys(capturedBlobs).includes(step.id);
          const current = stepIndex === i + 1;
          return (
            <div key={step.id} style={{
              width:           '12px',
              height:          '12px',
              borderRadius:    '50%',
              backgroundColor: done
                ? '#1e7e34'
                : current
                ? '#1a3c5e'
                : '#c0d4e8',
              transition:      'background-color 0.3s',
            }} />
          );
        })}
      </div>

      {/* ─────────────────────────────────────────
          STEP 0 — INTRO SCREEN
      ───────────────────────────────────────── */}
      {stepIndex === 0 && (
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ color: '#f0efee', margin: '0 0 12px' }}>
            Scan your documents
          </h3>
          <p style={{ color: '#9aa8b8', fontSize: '14px', lineHeight: 1.6,
            margin: '0 0 28px' }}>
            We'll use your camera to scan three documents. Have them ready:
          </p>

          {STEPS.map((step, i) => (
            <div key={step.id} style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '14px',
              backgroundColor: '#141a29',
              border:          '1.5px solid #2a3347',
              borderRadius:    '12px',
              padding:         '14px 18px',
              marginBottom:    '10px',
              textAlign:       'left',
            }}>
              <div style={{
                backgroundColor: '#3b82f6', color: '#fff',
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{step.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#f0efee', fontSize: '14px' }}>
                  {step.label}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#7a95ae' }}>
                  {step.hint}
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={() => setStepIndex(1)}
            style={{
              marginTop:       '20px',
              padding:         '16px 48px',
              fontSize:        '16px',
              fontWeight:      700,
              border:          'none',
              borderRadius:    '12px',
              backgroundColor: '#3b82f6',
              color:           '#ffffff',
              cursor:          'pointer',
            }}
          >
            Start Scanning →
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────
          STEPS 1-3 — CAMERA CAPTURE PER DOCUMENT
      ───────────────────────────────────────── */}
      {stepIndex >= 1 && stepIndex <= 3 && (
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {/* Document hint */}
          <div style={{
            backgroundColor: '#141a29',
            border:          '1px solid #2a3347',
            borderRadius:    '10px',
            padding:         '10px 16px',
            marginBottom:    '16px',
            fontSize:        '13px',
            color:           '#cbd5e1',
          }}>
            <strong style={{ color: '#f0efee' }}>Tip:</strong> {currentStep.tip}
          </div>

          {/* ── CAMERA VIEW (shown when live) ── */}
          {(cameraState === 'live' || cameraState === 'opening') && (
            <div style={{
              position:        'relative',
              borderRadius:    '14px',
              overflow:        'hidden',
              backgroundColor: '#000',
              marginBottom:    '16px',
              aspectRatio:     '4/3',
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Document alignment guide overlay */}
              <div style={{
                position:      'absolute',
                inset:         '10%',
                border:        '2px dashed rgba(255,255,255,0.7)',
                borderRadius:  '8px',
                pointerEvents: 'none',
              }} />
              <p style={{
                position:        'absolute',
                bottom:          '12px',
                left:            0,
                right:           0,
                textAlign:       'center',
                color:           '#fff',
                fontSize:        '12px',
                margin:          0,
                textShadow:      '0 1px 3px rgba(0,0,0,0.8)',
              }}>
                Align document within the guide box
              </p>
            </div>
          )}

          {/* ── CAPTURED PREVIEW ── */}
          {cameraState === 'captured' && capturedPreviews[currentStep.id] && (
            <div style={{ marginBottom: '16px' }}>
              <img
                src={capturedPreviews[currentStep.id]}
                alt="Captured"
                style={{
                  width:           '100%',
                  borderRadius:    '14px',
                  border:          '2px solid #3b82f6',
                  aspectRatio:     '4/3',
                  objectFit:       'cover',
                }}
              />
              <p style={{ textAlign: 'center', color: '#60a5fa',
                fontWeight: 700, fontSize: '14px', margin: '10px 0 0' }}>
                ✓ Image captured — looks good?
              </p>
            </div>
          )}

          {/* ── IDLE — nothing captured yet ── */}
          {cameraState === 'idle' && (
            <div style={{
              backgroundColor: '#141a29',
              border:          '2px dashed #2a3347',
              borderRadius:    '14px',
              aspectRatio:     '4/3',
              display:         'flex',
              flexDirection:   'column',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             '12px',
              marginBottom:    '16px',
            }}>
              <span style={{ fontSize: '48px' }}>{currentStep.icon}</span>
              <p style={{ color: '#9aa8b8', fontSize: '14px',
                textAlign: 'center', padding: '0 20px', margin: 0 }}>
                {currentStep.hint}
              </p>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>

            {/* Open camera */}
            {cameraState === 'idle' && (
              <button
                onClick={openCamera}
                style={{
                  padding:         '16px',
                  fontSize:        '16px',
                  fontWeight:      700,
                  border:          'none',
                  borderRadius:    '12px',
                  backgroundColor: '#3b82f6',
                  color:           '#ffffff',
                  cursor:          'pointer',
                }}
              >
                📷 Open Camera
              </button>
            )}

            {/* Capture frame */}
            {cameraState === 'live' && (
              <button
                onClick={captureFrame}
                style={{
                  padding:         '16px',
                  fontSize:        '16px',
                  fontWeight:      700,
                  border:          'none',
                  borderRadius:    '12px',
                  backgroundColor: '#1e7e34',
                  color:           '#ffffff',
                  cursor:          'pointer',
                }}
              >
                📸 Capture
              </button>
            )}

            {/* Confirm + Retake */}
            {cameraState === 'captured' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleRetake}
                  style={{
                    flex:         1,
                    padding:      '14px',
                    fontSize:     '14px',
                    fontWeight:   700,
                    border:       '1.5px solid #3b82f6',
                    borderRadius: '12px',
                    background:   '#141a29',
                    color:        '#f0efee',
                    cursor:       'pointer',
                  }}
                >
                  ↺ Retake
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    flex:            2,
                    padding:         '14px',
                    fontSize:        '15px',
                    fontWeight:      700,
                    border:          'none',
                    borderRadius:    '12px',
                    backgroundColor: '#3b82f6',
                    color:           '#ffffff',
                    cursor:          'pointer',
                  }}
                >
                  {stepIndex < STEPS.length ? 'Use This → Next Document' : 'Use This → Extract Details'}
                </button>
              </div>
            )}

          </div>

          {/* Error */}
          {error && (
            <p style={{ color: '#f87171', fontSize: '13px',
              marginTop: '12px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          {/* Document thumbnails — captured so far */}
          {Object.keys(capturedBlobs).length > 0 && (
            <div style={{
              display:       'flex',
              gap:           '10px',
              marginTop:     '20px',
              flexWrap:      'wrap',
            }}>
              {STEPS.filter((s) => capturedPreviews[s.id]).map((s) => (
                <div key={s.id} style={{ textAlign: 'center' }}>
                  <img
                    src={capturedPreviews[s.id]}
                    alt={s.label}
                    style={{
                      width:        '80px',
                      height:       '60px',
                      objectFit:    'cover',
                      borderRadius: '8px',
                      border:       '2px solid #3b82f6',
                    }}
                  />
                  <p style={{ margin: '3px 0 0', fontSize: '10px',
                    color: '#60a5fa', fontWeight: 700 }}>
                    ✓ {s.id === 'aadhaarFront'
                      ? 'Front'
                      : s.id === 'aadhaarBack'
                      ? 'Back'
                      : 'PAN'}
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────
          STEP 4 — TRANSITION TO CONFIRMATION
      ───────────────────────────────────────── */}
      {stepIndex === 4 && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ color: '#f0efee', margin: '0 0 12px' }}>
            Preparing your confirmation page...
          </h3>
          <p style={{ color: '#9aa8b8', fontSize: '14px', lineHeight: 1.6 }}>
            You’ll review and edit your details manually before continuing.
          </p>
          {error && (
            <div style={{
              marginTop:       '20px',
              backgroundColor: '#111827',
              border:          '1.5px solid #dc2626',
              borderRadius:    '10px',
              padding:         '14px',
              color:           '#fecaca',
              fontSize:        '13px',
            }}>
              {error}
              <br />
              <button
                onClick={() => { setStepIndex(3); setError(''); }}
                style={{
                  marginTop:    '10px',
                  background:   'none',
                  border:       'none',
                  color:        '#60a5fa',
                  cursor:       'pointer',
                  fontWeight:   700,
                  fontSize:     '13px',
                }}
              >
                ← Go back and retake
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

    </div>
  );
}

export default DocumentCapturePage;