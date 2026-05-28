// client/src/pages/onboarding/FaceCapturePage.jsx
// ─────────────────────────────────────────────────────────────
// Step 4 — Capture 5-7 face images for CompreFace enrollment.
//
// KEY FIXES:
//   1. stopAllActiveTracks() called BEFORE getUserMedia
//      — prevents conflict with document capture camera stream
//   2. isMountedRef prevents state updates after unmount
//   3. Small delay before getUserMedia — lets previous
//      stream release the hardware fully
//   4. Proper cleanup in useEffect return
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate }   from 'react-router-dom';
import axios             from 'axios';
import { useOnboarding } from '../../context/OnboardingContext';

const MIN_CAPTURES = 5;
const MAX_CAPTURES = 7;

// ── Stop ALL active media tracks on the page ──
// This is the nuclear option — ensures no leftover streams
// from the document capture step are still running.
const stopAllActiveTracks = () => {
  // Get all video elements and stop their streams
  document.querySelectorAll('video').forEach((video) => {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => {
        track.stop();
        console.log('[FaceCapture] Stopped orphaned track from:', video.id || 'unnamed video');
      });
      video.srcObject = null;
    }
  });
};

function FaceCapturePage() {

  const navigate = useNavigate();
  const {
    subjectName,
    newUserId,
    capturedFaces,
    addFaceCapture,
    setCapturedFaces,
    resetOnboarding,
  } = useOnboarding();

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const isMountedRef = useRef(true);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previews,    setPreviews]    = useState([]);   // captured image preview URLs
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  // ── Track mount state ──
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Start camera on mount ──
  useEffect(() => {
    // FIX: stop ALL active tracks first, then wait briefly before
    // calling getUserMedia. This gives the browser time to fully
    // release the camera hardware from the document capture step.
    console.log('[FaceCapture] Stopping all existing streams before starting...');
    stopAllActiveTracks();

    // Small delay — gives camera hardware time to release
    const timer = setTimeout(() => {
      if (isMountedRef.current) startCamera();
    }, 500);

    return () => {
      clearTimeout(timer);
      // Stop our stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          t.stop();
          console.log('[FaceCapture] Cleanup: stopped track on unmount');
        });
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    if (!isMountedRef.current) return;

    setCameraError('');
    console.log('[FaceCapture] Calling getUserMedia...');

    try {
      // Stop any existing stream on this component before starting new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:      { ideal: 640 },
          height:     { ideal: 480 },
          facingMode: 'user',    // front camera for face capture
        },
        audio: false,
      });

      if (!isMountedRef.current) {
        // Component unmounted while waiting — stop stream immediately
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current          = stream;
      videoRef.current.srcObject = stream;
      setCameraReady(true);
      console.log('[FaceCapture] Camera started successfully');

    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('[FaceCapture] getUserMedia failed:', err.name, err.message);
      setCameraReady(false);

      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and refresh.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError') {
        // Camera is still in use — try again after a longer delay
        setCameraError('Camera is busy. Retrying in 2 seconds...');
        console.log('[FaceCapture] Camera busy — retrying in 2 seconds');
        setTimeout(() => {
          if (isMountedRef.current) startCamera();
        }, 2000);
      } else {
        setCameraError(`Camera error: ${err.message}. Please refresh the page.`);
      }
    }
  };

  // ── Capture a single frame ──
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !cameraReady) return;
    if (previews.length >= MAX_CAPTURES) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    // Mirror the image (since front camera is mirrored in CSS)
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!isMountedRef.current) return;

      const url = URL.createObjectURL(blob);
      addFaceCapture(blob);
      setPreviews((prev) => [...prev, url]);
      console.log(`[FaceCapture] Captured face ${previews.length + 1}/${MAX_CAPTURES}`);
    }, 'image/jpeg', 0.92);
  }, [cameraReady, previews.length, addFaceCapture]);

  // ── Remove a specific capture ──
  const removeCapture = (index) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFaces    = capturedFaces.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    setCapturedFaces(newFaces);
  };

  // ── Submit all faces to CompreFace ──
  const handleSubmit = async () => {
    if (capturedFaces.length < MIN_CAPTURES) return;

    setSubmitting(true);
    setError('');

    // Stop camera before submitting
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraReady(false);
    }

    try {
      console.log(`[FaceCapture] Enrolling ${capturedFaces.length} faces for: ${subjectName}`);

      const formData = new FormData();
      formData.append('userId',      newUserId);
      formData.append('subjectName', subjectName);

      capturedFaces.forEach((blob, i) => {
        formData.append('faces', blob, `face_${i}.jpg`);
      });

      const response = await axios.post('/api/onboarding/enroll-faces', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,    // face enrollment can be slow — 60s
      });

      console.log('[FaceCapture] Enrollment response:', response.data);

      if (response.data.success) {
        navigate('/new-user/success', { replace: true });
      } else {
        setError(response.data.message || 'Face enrollment failed. Please try again.');
        setSubmitting(false);
      }

    } catch (err) {
      console.error('[FaceCapture] Enrollment error:', err.response?.data || err.message);
      setError('Could not register faces. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    resetOnboarding();
    navigate('/', { replace: true });
  };

  const captureCount   = previews.length;
  const canSubmit      = captureCount >= MIN_CAPTURES && !submitting;
  const canCaptureMore = captureCount < MAX_CAPTURES && !submitting;

  // ── Capture angle instructions ──
  const ANGLE_HINTS = [
    { icon: '😐', label: 'Face forward (centre)' },
    { icon: '😶‍🌫️', label: 'Slight left turn'     },
    { icon: '😶‍🌫️', label: 'Slight right turn'    },
    { icon: '🙂',  label: 'Look slightly up'       },
    { icon: '🙁',  label: 'Look slightly down'     },
    { icon: '😐',  label: 'Centre again'           },
    { icon: '😀',  label: 'Natural smile'          },
  ];

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
          onClick={() => navigate('/new-user/confirm')}
          style={{ background: 'none', border: 'none', color: '#1a3c5e',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, color: '#1a3c5e', fontSize: '20px', fontWeight: 700 }}>
          Face Registration
        </h2>
        <button onClick={handleCancel} style={{
          background: 'none', border: '1.5px solid #e74c3c', color: '#e74c3c',
          padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
          fontWeight: 700, cursor: 'pointer',
        }}>
          ✕ Cancel
        </button>
      </div>

      <p style={{ color: '#4a6a8a', fontSize: '14px', textAlign: 'center',
        margin: '8px 0 20px', maxWidth: '360px' }}>
        We need <strong>{MIN_CAPTURES}–{MAX_CAPTURES} photos</strong> of your face
        from different angles for recognition.
      </p>

      {/* ── Camera error ── */}
      {cameraError && (
        <div style={{
          backgroundColor: '#fdf0ee', border: '1.5px solid #e74c3c',
          borderRadius: '10px', padding: '14px 18px',
          marginBottom: '16px', width: '100%', maxWidth: '480px',
          boxSizing: 'border-box', fontSize: '13px', color: '#c0392b',
          textAlign: 'center',
        }}>
          {cameraError}
          <br />
          <button
            onClick={startCamera}
            style={{ marginTop: '8px', background: 'none', border: 'none',
              color: '#1a3c5e', cursor: 'pointer', fontWeight: 700 }}
          >
            ↺ Retry Camera
          </button>
        </div>
      )}

      {/* ── Camera viewfinder ── */}
      <div style={{
        position:        'relative',
        width:           '100%',
        maxWidth:        '400px',
        backgroundColor: '#000',
        borderRadius:    '16px',
        overflow:        'hidden',
        aspectRatio:     '4/3',
        marginBottom:    '16px',
      }}>
        <video
          ref={videoRef}
          id="face-capture-video"
          autoPlay
          playsInline
          muted
          style={{
            width:       '100%',
            height:      '100%',
            objectFit:   'cover',
            // Mirror front camera — natural for user
            transform:   'scaleX(-1)',
            display:     cameraReady ? 'block' : 'none',
          }}
        />

        {/* Oval face guide */}
        {cameraReady && (
          <div style={{
            position:      'absolute',
            top:           '50%',
            left:          '50%',
            transform:     'translate(-50%, -50%)',
            width:         '160px',
            height:        '200px',
            border:        '2px dashed rgba(255,255,255,0.7)',
            borderRadius:  '50%',
            pointerEvents: 'none',
          }} />
        )}

        {/* Camera loading / offline */}
        {!cameraReady && !cameraError && (
          <div style={{
            position:        'absolute',
            inset:           0,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            color:           '#fff',
            flexDirection:   'column',
            gap:             '12px',
          }}>
            <div style={{ fontSize: '32px' }}>📷</div>
            <p style={{ margin: 0, fontSize: '14px' }}>Starting camera...</p>
          </div>
        )}

        {/* Capture count badge */}
        {cameraReady && (
          <div style={{
            position:        'absolute',
            top:             '12px',
            right:           '12px',
            backgroundColor: captureCount >= MIN_CAPTURES
              ? 'rgba(30,126,52,0.85)'
              : 'rgba(26,60,94,0.85)',
            color:           '#fff',
            padding:         '4px 12px',
            borderRadius:    '20px',
            fontSize:        '13px',
            fontWeight:      700,
          }}>
            {captureCount} / {MAX_CAPTURES}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Angle hint for current capture ── */}
      {cameraReady && captureCount < MAX_CAPTURES && (
        <div style={{
          backgroundColor: '#eaf2fb',
          border:          '1px solid #aac4e0',
          borderRadius:    '10px',
          padding:         '10px 16px',
          marginBottom:    '16px',
          fontSize:        '14px',
          color:           '#1a3c5e',
          textAlign:       'center',
          width:           '100%',
          maxWidth:        '400px',
          boxSizing:       'border-box',
        }}>
          {ANGLE_HINTS[captureCount]?.icon} {ANGLE_HINTS[captureCount]?.label}
        </div>
      )}

      {/* ── Capture button ── */}
      {cameraReady && canCaptureMore && (
        <button
          onClick={captureFrame}
          style={{
            padding:         '16px 48px',
            fontSize:        '16px',
            fontWeight:      700,
            border:          'none',
            borderRadius:    '12px',
            backgroundColor: '#1e7e34',
            color:           '#ffffff',
            cursor:          'pointer',
            marginBottom:    '20px',
          }}
        >
          📸 Capture Photo {captureCount + 1}
        </button>
      )}

      {/* ── Captured thumbnails ── */}
      {previews.length > 0 && (
        <div style={{
          display:       'flex',
          flexWrap:      'wrap',
          gap:           '10px',
          justifyContent:'center',
          marginBottom:  '20px',
          width:         '100%',
          maxWidth:      '400px',
        }}>
          {previews.map((url, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={url}
                alt={`Face ${i + 1}`}
                style={{
                  width:        '80px',
                  height:       '80px',
                  objectFit:    'cover',
                  borderRadius: '50%',
                  border:       '2px solid #1e7e34',
                }}
              />
              {/* Remove button */}
              {!submitting && (
                <button
                  onClick={() => removeCapture(i)}
                  style={{
                    position:        'absolute',
                    top:             '-4px',
                    right:           '-4px',
                    width:           '20px',
                    height:          '20px',
                    borderRadius:    '50%',
                    backgroundColor: '#e74c3c',
                    color:           '#fff',
                    border:          'none',
                    fontSize:        '11px',
                    cursor:          'pointer',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    padding:         0,
                  }}
                >
                  ✕
                </button>
              )}
              <p style={{ margin: '4px 0 0', textAlign: 'center',
                fontSize: '11px', color: '#1e7e34' }}>
                #{i + 1}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Submit button ── */}
      {captureCount >= MIN_CAPTURES && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding:         '16px 48px',
            fontSize:        '16px',
            fontWeight:      700,
            border:          'none',
            borderRadius:    '12px',
            backgroundColor: canSubmit ? '#1a3c5e' : '#8aa0b5',
            color:           '#ffffff',
            cursor:          canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting
            ? '⏳ Registering your face...'
            : `Complete Registration (${captureCount} photos) →`}
        </button>
      )}

      {captureCount > 0 && captureCount < MIN_CAPTURES && (
        <p style={{ color: '#4a6a8a', fontSize: '13px', marginTop: '8px' }}>
          Need {MIN_CAPTURES - captureCount} more photo{MIN_CAPTURES - captureCount > 1 ? 's' : ''} to continue
        </p>
      )}

      {error && (
        <p style={{ color: '#c0392b', fontSize: '13px',
          marginTop: '12px', textAlign: 'center' }}>
          {error}
        </p>
      )}

    </div>
  );
}

export default FaceCapturePage;