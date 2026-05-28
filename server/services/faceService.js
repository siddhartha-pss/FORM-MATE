// server/services/faceService.js
// ─────────────────────────────────────────────────────────────
// CompreFace API wrapper service.
//
// Responsibilities:
//   - Send an image buffer to the CompreFace recognition endpoint
//   - Parse the response
//   - Return a clean result object to the controller
//
// This service does NOT talk to MongoDB.
// It only talks to CompreFace.
//
// CompreFace Recognition endpoint:
//   POST {COMPREFACE_URL}/api/v1/recognition/recognize
//   Header: x-api-key: {COMPREFACE_API_KEY}
//   Body: multipart/form-data { file: <image> }
//
// CompreFace response shape:
// {
//   result: [{
//     subjects: [{ subject: "Drashwanth", similarity: 0.97 }],
//     box: { x_min, y_min, x_max, y_max, probability }
//   }]
// }
// ─────────────────────────────────────────────────────────────

const axios = require('axios');
const FormData = require('form-data');

const COMPREFACE_URL = process.env.COMPREFACE_URL || 'http://localhost:8000';
const API_KEY = process.env.COMPREFACE_API_KEY || process.env.COMPREFACE_RECOGNITION_API_KEY;

const createFormData = (buffer, filename, contentType) => {
  const form = new FormData();
  form.append('file', buffer, {
    filename,
    contentType,
  });
  return form;
};

const recognizeFace = async (imageBuffer, mimetype) => {
  // ┌─────────────────────────────────────────────────────────┐
  // │ WHY 0.90 THRESHOLD FOR BANKING?                         │
  // ├─────────────────────────────────────────────────────────┤
  // │ CompreFace universal-3-pro model returns similarity as  │
  // │ a distance metric (0.0 = perfect match, 1.0 = no match).│
  // │ However, results show it returns normalized scores      │
  // │ where higher = more similar.                            │
  // │                                                         │
  // │ At 0.80: Too permissive — different faces can score     │
  // │ 0.80+ if they share similar features (age, ethnicity).  │
  // │                                                         │
  // │ At 0.90: Strict enough to reject unknown faces while    │
  // │ allowing registered users to pass if lighting & angle   │
  // │ are reasonable. Industry standard for banking systems.  │
  // │                                                         │
  // │ Why false matches happen:                              │
  // │ 1. Facial similarity (twins, similar age groups)        │
  // │ 2. Bad lighting/angle makes CompreFace uncertain        │
  // │ 3. Masks, glasses, or facial hair changes              │
  // │ 4. Low model confidence returns middle-range scores     │
  // │ 5. CompreFace defaults to highest match even if poor    │
  // └─────────────────────────────────────────────────────────┘
  const THRESHOLD = parseFloat(process.env.COMPREFACE_THRESHOLD) || 0.90;

  const form = createFormData(imageBuffer, 'capture.jpg', mimetype || 'image/jpeg');

  let response;
  try {
    response = await axios.post(
      `${COMPREFACE_URL}/api/v1/recognition/recognize`,
      form,
      {
        headers: {
          'x-api-key': API_KEY,
          ...form.getHeaders(),
        },
        timeout: 15000,
      }
    );
  } catch (axiosError) {
    const status = axiosError.response?.status;
    const message = axiosError.response?.data?.message || axiosError.message;

    if (status === 400) {
      return {
        matched: false,
        subject: null,
        similarity: null,
        reason: 'No face detected in the image. Please try again.',
      };
    }

    throw new Error(`CompreFace error (${status || 'network'}): ${message}`);
  }

  const results = response.data?.result;

  if (!results || results.length === 0) {
    return {
      matched: false,
      subject: null,
      similarity: null,
      reason: 'No face detected in the captured image.',
    };
  }

  const firstFace = results[0];
  const subjects = firstFace.subjects;

  if (!subjects || subjects.length === 0) {
    return {
      matched: false,
      subject: null,
      similarity: null,
      reason: 'Face detected but not recognised. Please use account number.',
    };
  }

  const bestMatch = subjects[0];

  // ─── SIMILARITY THRESHOLD VALIDATION ───
  // Log all recognition attempts for debugging and auditing
  const similarityPercent = (bestMatch.similarity * 100).toFixed(1);
  console.log(
    `[FaceService] Face recognition attempt:`,
    `subject="${bestMatch.subject}" similarity=${similarityPercent}% threshold=${(THRESHOLD * 100).toFixed(0)}%`
  );

  // CRITICAL: Reject if similarity is below the banking-grade threshold
  // This is the primary defense against unknown faces being incorrectly accepted
  if (bestMatch.similarity < THRESHOLD) {
    console.warn(
      `[FaceService] ⚠️  UNKNOWN FACE DETECTED (similarity ${similarityPercent}% < ${(THRESHOLD * 100).toFixed(0)}% threshold)`,
      `Rejecting potential false match for subject: "${bestMatch.subject}"`
    );
    return {
      matched: false,
      subject: null,  // Do NOT return the wrongly-matched subject name
      similarity: bestMatch.similarity,
      reason: `Face does not match with sufficient confidence (${similarityPercent}%). Please try again with better lighting or use account number.`,
    };
  }

  // Only return success if similarity meets or exceeds threshold
  console.log(
    `[FaceService] ✅ FACE RECOGNIZED:`,
    `subject="${bestMatch.subject}" similarity=${similarityPercent}% (meets ${(THRESHOLD * 100).toFixed(0)}% threshold)`
  );
  return {
    matched: true,
    subject: bestMatch.subject,
    similarity: bestMatch.similarity,
    reason: 'Face recognised successfully.',
  };
};

const registerFaces = async (subjectId, base64Images = []) => {
  if (!subjectId) {
    throw new Error('subjectId is required.');
  }

  const results = [];

  for (const base64 of base64Images) {
    const imageData = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(imageData, 'base64');
    const form = createFormData(buffer, 'face.jpg', 'image/jpeg');

    const response = await axios.post(
      `${COMPREFACE_URL}/api/v1/recognition/faces?subject=${encodeURIComponent(subjectId)}`,
      form,
      {
        headers: {
          'x-api-key': API_KEY,
          ...form.getHeaders(),
        },
        timeout: 15000,
      }
    );

    results.push(response.data);
  }

  return results;
};

const deleteSubject = async (subjectId) => {
  if (!subjectId) {
    throw new Error('subjectId is required.');
  }

  await axios.delete(
    `${COMPREFACE_URL}/api/v1/recognition/subjects/${encodeURIComponent(subjectId)}`,
    {
      headers: {
        'x-api-key': API_KEY,
      },
    }
  );
};

module.exports = { recognizeFace, registerFaces, deleteSubject };