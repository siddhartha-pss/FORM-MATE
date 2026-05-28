// server/controllers/sttController.js
// ─────────────────────────────────────────────────────────────
// Handles audio transcription via AssemblyAI.
//
// Flow:
//   1. Receive audio blob (webm format from MediaRecorder)
//   2. Upload audio to AssemblyAI
//   3. Poll for transcription result
//   4. Return transcript to frontend
// ─────────────────────────────────────────────────────────────

const axios = require('axios');

const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_URL = 'https://api.assemblyai.com/v2';

// ── Helper: poll for transcription result ──
// AssemblyAI is async — we submit, then poll until done
const pollTranscription = async (transcriptId) => {
  const maxAttempts = 20;
  const delayMs     = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(
      `${ASSEMBLYAI_URL}/transcript/${transcriptId}`,
      { headers: { authorization: ASSEMBLYAI_KEY } }
    );

    const { status, text, error } = response.data;

    if (status === 'completed') return text;
    if (status === 'error')     throw new Error(`AssemblyAI error: ${error}`);

    // Still processing — wait and retry
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error('Transcription timed out after 40 seconds.');
};

// ── transcribeAudio ──
// POST /api/stt/transcribe
const transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file received.' });
    }

    console.log(`[STT] Received audio: ${(req.file.buffer.length / 1024).toFixed(1)} KB`);

    // ── Step 1: Upload audio to AssemblyAI ──
    const uploadResponse = await axios.post(
      `${ASSEMBLYAI_URL}/upload`,
      req.file.buffer,
      {
        headers: {
          authorization:  ASSEMBLYAI_KEY,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 30000,
      }
    );

    const uploadUrl = uploadResponse?.data?.upload_url;
    if (!uploadUrl) {
      throw new Error('AssemblyAI upload response missing upload_url');
    }
    console.log('[STT] Audio uploaded to AssemblyAI:', uploadUrl);

    // ── Step 2: Submit for transcription ──
    const transcriptResponse = await axios.post(
      `${ASSEMBLYAI_URL}/transcript`,
      {
        audio_url:      uploadUrl,
        language_code:  'en',    // English — AssemblyAI handles Indian English well
        speech_models:  ['universal-3-pro'],
      },
      { headers: { authorization: ASSEMBLYAI_KEY } }
    );

    const transcriptId = transcriptResponse.data.id;
    console.log(`[STT] Transcription submitted, ID: ${transcriptId}`);

    // ── Step 3: Poll until result is ready ──
    const transcript = await pollTranscription(transcriptId);
    console.log(`[STT] Transcript: "${transcript}"`);

    return res.status(200).json({
      success:    true,
      transcript: transcript || '',
    });

  } catch (error) {
    console.error('[STT] Transcription error:', error.response?.status, error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Transcription failed. Please select a form using the cards below.',
    });
  }
};

module.exports = { transcribeAudio };