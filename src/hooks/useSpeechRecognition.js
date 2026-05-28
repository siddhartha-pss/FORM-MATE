// client/src/hooks/useSpeechRecognition.js
// HYBRID VERSION — Web Speech API first, backend fallback second

import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { getSpeechRecognition, isSpeechSupported } from '../utils/speechSupport';

const useSpeechRecognition = () => {

  const [isListening,  setIsListening]  = useState(false);
  const [transcript,   setTranscript]   = useState('');
  const [confidence,   setConfidence]   = useState(0);
  const [error,        setError]        = useState('');
  const [mode,         setMode]         = useState('idle');
  // mode: 'idle' | 'browser-stt' | 'recording' | 'uploading'

  const recognitionRef   = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const isMountedRef     = useRef(true);
  const networkFailedRef = useRef(false);   // remember if browser STT failed

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortRecognition();
      stopRecording();
    };
  }, []);

  const abortRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror  = null;
        recognitionRef.current.onend    = null;
        recognitionRef.current.abort();
      } catch { /* ignore */ }
      recognitionRef.current = null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // ── Strategy A: Browser Web Speech API ──
  const tryBrowserSTT = useCallback(() => {
    if (!isSpeechSupported()) {
      // Browser doesn't support it — go straight to backend
      tryBackendSTT();
      return;
    }

    const SR          = getSpeechRecognition();
    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.lang           = 'en-IN';
    recognition.continuous     = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      if (!isMountedRef.current) return;
      setIsListening(true);
      setMode('browser-stt');
      setError('');
      console.log('[STT] Browser STT started');
    };

    recognition.onresult = (event) => {
      if (!isMountedRef.current) return;
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final      += r[0].transcript;
          setConfidence(r[0].confidence || 0);
        } else {
          interim += r[0].transcript;
        }
      }
      setTranscript(final || interim);
    };

    recognition.onend = () => {
      if (!isMountedRef.current) return;
      setIsListening(false);
      setMode('idle');
    };

    recognition.onerror = (event) => {
      if (!isMountedRef.current) return;
      console.warn(`[STT] Browser STT error: ${event.error}`);

      if (event.error === 'network') {
        // ── AUTOMATIC FALLBACK ──
        // Browser STT failed due to network.
        // Switch to backend recording silently.
        networkFailedRef.current = true;
        console.log('[STT] Network error → falling back to backend STT');
        setError('');   // don't show error — seamlessly switch
        abortRecognition();
        tryBackendSTT();
      } else {
        setIsListening(false);
        setMode('idle');
        const messages = {
          'not-allowed':   'Microphone permission denied. Allow mic in Chrome settings.',
          'no-speech':     'No speech detected. Please try again.',
          'audio-capture': 'Microphone not accessible. Close other apps using your mic.',
        };
        setError(messages[event.error] || `Mic error: ${event.error}`);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('[STT] start() threw:', err.message);
      tryBackendSTT();
    }
  }, []);

  // ── Strategy B: MediaRecorder + Backend ──
  const tryBackendSTT = useCallback(async () => {
    console.log('[STT] Using backend STT (MediaRecorder → Express → AssemblyAI)');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioChunksRef.current = [];
      const mediaRecorder    = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all mic tracks
        stream.getTracks().forEach((t) => t.stop());

        if (!isMountedRef.current) return;

        setMode('uploading');
        setIsListening(false);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log(`[STT] Sending ${(audioBlob.size / 1024).toFixed(1)} KB to backend...`);

          const formData = new FormData();
          formData.append('audio', audioBlob, 'speech.webm');

          const response = await axios.post('/api/stt/transcribe', formData, {
            timeout: 45000,   // AssemblyAI can take up to 30s
          });

          if (response.data.success && response.data.transcript) {
            setTranscript(response.data.transcript);
            setConfidence(0.9);   // AssemblyAI is generally high confidence
            console.log(`[STT] Got transcript: "${response.data.transcript}"`);
          } else {
            setError('Could not understand the audio. Please try again or use the cards.');
          }
        } catch (uploadErr) {
          console.error('[STT] Backend transcription failed:', uploadErr.message);
          setError('Transcription service unavailable. Please select a form using the cards.');
        } finally {
          if (isMountedRef.current) setMode('idle');
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      setMode('recording');
      setError('');
      console.log('[STT] MediaRecorder started — recording for 5 seconds');

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 5000);

    } catch (micErr) {
      console.error('[STT] Mic access failed:', micErr.message);
      setMode('idle');
      setIsListening(false);
      if (micErr.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow mic access in Chrome.');
      } else {
        setError('Could not access microphone. Please check your hardware.');
      }
    }
  }, []);

  // ── Public API ──
  const startListening = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError('');

    // If we already know browser STT fails on this network,
    // skip straight to backend
    if (networkFailedRef.current) {
      tryBackendSTT();
    } else {
      tryBrowserSTT();
    }
  }, [tryBrowserSTT, tryBackendSTT]);

  const stopListening = useCallback(() => {
    abortRecognition();
    stopRecording();
    setIsListening(false);
    setMode('idle');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError('');
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    error,
    mode,           // expose mode so UI can show "Recording..." vs "Uploading..."
    startListening,
    stopListening,
    resetTranscript,
    isSupported:    true,   // always true — fallback makes it work in any browser
  };
};

export default useSpeechRecognition;