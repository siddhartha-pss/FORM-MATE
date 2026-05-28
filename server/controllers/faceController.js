// server/controllers/faceController.js
// ─────────────────────────────────────────────────────────────
// Handles the face recognition flow:
//
//   1. Receive uploaded image from React frontend
//   2. Call faceService.recognizeFace()
//   3. If matched → look up user in MongoDB by faceSubjectName
//   4. Fetch their linked active accounts
//   5. Return { user, accounts } to frontend
//
// If recognition fails at any step →
//   return clear error with reason so frontend can
//   redirect to the fallback (manual account entry) screen.
// ─────────────────────────────────────────────────────────────

const { recognizeFace, registerFaces, deleteSubject } = require('../services/faceService');
const User    = require('../models/user');
const Account = require('../models/Account');

const normalizeBase64Image = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    if (value.startsWith('data:')) return value;
    return `data:image/jpeg;base64,${value}`;
  }

  if (Buffer.isBuffer(value)) {
    return `data:image/jpeg;base64,${value.toString('base64')}`;
  }

  return null;
};

const extractFaceImages = (req) => {
  if (Array.isArray(req.body?.images)) {
    return req.body.images
      .map((image) => normalizeBase64Image(image))
      .filter(Boolean);
  }

  if (Array.isArray(req.files)) {
    return req.files
      .map((file) => normalizeBase64Image(file.buffer))
      .filter(Boolean);
  }

  return [];
};

const registerFacesForUser = async (req, res) => {
  try {
    const { userId, subjectName } = req.body || {};
    const faceImages = extractFaceImages(req);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required.',
      });
    }

    if (!faceImages.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one face image is required.',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const resolvedSubject = (subjectName || user.faceSubjectName || user.fullName || user.name || user._id.toString()).trim();

    if (!resolvedSubject) {
      return res.status(400).json({
        success: false,
        message: 'Unable to resolve a CompreFace subject name.',
      });
    }

    if (user.comprefaceSubjectId && user.comprefaceSubjectId !== resolvedSubject) {
      try {
        await deleteSubject(user.comprefaceSubjectId);
      } catch (deleteError) {
        console.warn('[FaceController] Could not remove old CompreFace subject:', deleteError.message);
      }
    }

    const enrollmentResults = await registerFaces(resolvedSubject, faceImages);

    await User.findByIdAndUpdate(userId, {
      faceRegistered: true,
      faceSubjectName: resolvedSubject,
      comprefaceSubjectId: resolvedSubject,
    });

    return res.status(200).json({
      success: true,
      subjectName: resolvedSubject,
      count: faceImages.length,
      results: enrollmentResults,
    });
  } catch (error) {
    console.error('[FaceController] Face enrollment failed:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Face enrollment failed.',
    });
  }
};

// ── recognizeAndFetch ─────────────────────────────────────────
// POST /api/face/recognize
// Body: multipart/form-data { image: <file> }
const recognizeAndFetch = async (req, res) => {
  try {

    // ── Step 1: Check image was received ──
    // multer puts the uploaded file on req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image received. Please capture your face and try again.',
      });
    }

    const { buffer, mimetype } = req.file;

    // ── Step 2: Send image to CompreFace ──
    console.log(`[FaceController] Sending image to CompreFace (${(buffer.length / 1024).toFixed(1)} KB)...`);

    const faceResult = await recognizeFace(buffer, mimetype);

    console.log(`[FaceController] CompreFace result:`, {
      matched:    faceResult.matched,
      subject:    faceResult.subject,
      similarity: faceResult.similarity,
    });

    // ── Step 3: Handle failed recognition (threshold not met) ──
    // This includes:
    //   - No face detected in image
    //   - Face detected but not in database
    //   - Face similarity below 0.90 threshold (UNKNOWN FACE)
    if (!faceResult.matched) {
      console.log(
        `[FaceController] Recognition failed: ${faceResult.reason} (similarity: ${faceResult.similarity ? (faceResult.similarity * 100).toFixed(1) + '%' : 'N/A'})`
      );
      return res.status(200).json({
        success:   false,
        matched:   false,
        reason:    faceResult.reason,
        similarity: faceResult.similarity,
        // Frontend uses this to show correct message to user
        // and decide whether to offer the fallback button
      });
    }

    // ── Step 4: Look up user in MongoDB (only after similarity threshold passed) ──
    // At this point, we KNOW similarity >= 0.90
    // faceResult.subject = "Drashwanth" (from CompreFace)
    // We find the user whose faceSubjectName matches this exactly
    console.log(
      `[FaceController] Looking up user in MongoDB for subject: "${faceResult.subject}"`
    );
    const user = await User.findOne({
      faceSubjectName: faceResult.subject,
    });

    if (!user) {
      // Face passed 0.90 similarity threshold in CompreFace
      // but no matching user exists in DB.
      // This is a data consistency issue, not an unknown face.
      // Seed data faceSubjectName doesn't match the CompreFace subject.
      console.error(
        `[FaceController] ❌ DATA MISMATCH: Face passed 0.90 threshold (subject: "${faceResult.subject}") but no user in MongoDB.`,
        `Similarity was ${(faceResult.similarity * 100).toFixed(1)}%. Check seed data.`
      );
      return res.status(404).json({
        success: false,
        matched: true,             // face was recognised with high confidence
        reason:  'Customer record not found in system. Please contact bank staff.',
        subject: faceResult.subject,
        similarity: faceResult.similarity,
      });
    }

    // ── Step 5: Fetch linked active accounts ──
    // At this point: face matched at 0.90+ threshold AND user found in DB
    console.log(
      `[FaceController] ✅ SUCCESS: User "${user.name}" recognized with ${(faceResult.similarity * 100).toFixed(1)}% similarity. Fetching accounts...`
    );
    const accounts = await Account.find({
      userId: user._id,
      status: 'active',           // only show accounts the user can transact on
    }).sort({ accountType: 1 });

    // ── Step 6: Build safe response ──
    // Never send aadhaar, PAN, or faceSubjectName to the frontend
    console.log(
      `[FaceController] Returning ${accounts.length} active account(s) for user: ${user.name}`
    );
    return res.status(200).json({
      success:    true,
      matched:    true,
      similarity: faceResult.similarity,  // Log the actual similarity for client-side display
      data: {
        user: {
          _id:       user._id,
          name:      user.name,
          phone:     user.phone,
          email:     user.email,
          dob:       user.dob,
          gender:    user.gender,
          kycStatus: user.kycStatus,
          address:   user.address,
        },
        accounts: accounts.map((acc) => ({
          _id:           acc._id,
          accountNumber: acc.accountNumber,
          accountType:   acc.accountType,
          branch:        acc.branch,
          ifsc:          acc.ifsc,
          balance:       acc.balance,   // in paise — frontend divides by 100
          status:        acc.status,
        })),
      },
    });

  } catch (error) {
    console.error('[FaceController] Unexpected error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Face recognition service error. Please try again or use account number.',
    });
  }
};

module.exports = { recognizeAndFetch, registerFacesForUser };