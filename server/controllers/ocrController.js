const { extractTextFromImage } = require("../services/ocrService");
const {
  parseAadhaarFront,
  parseAadhaarBack,
  parsePAN,
} = require("../utils/ocrParser");

/**
 * POST /api/ocr/aadhaar-front
 * Body: { image: base64string }
 */
async function ocrAadhaarFront(req, res) {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image is required" });

    const rawText = await extractTextFromImage(image);
    const parsed = parseAadhaarFront(rawText);

    return res.json({ success: true, parsed, rawText });
  } catch (err) {
    console.error("OCR Aadhaar Front error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/ocr/aadhaar-back
 * Body: { image: base64string }
 */
async function ocrAadhaarBack(req, res) {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image is required" });

    const rawText = await extractTextFromImage(image);
    const parsed = parseAadhaarBack(rawText);

    return res.json({ success: true, parsed, rawText });
  } catch (err) {
    console.error("OCR Aadhaar Back error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/ocr/pan
 * Body: { image: base64string }
 */
async function ocrPAN(req, res) {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image is required" });

    const rawText = await extractTextFromImage(image);
    const parsed = parsePAN(rawText);

    return res.json({ success: true, parsed, rawText });
  } catch (err) {
    console.error("OCR PAN error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { ocrAadhaarFront, ocrAadhaarBack, ocrPAN };