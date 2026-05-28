const axios = require("axios");
const FormData = require("form-data");

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;
const OCR_SPACE_URL = "https://api.ocr.space/parse/image";

/**
 * Sends a base64 image to OCR.Space and returns raw parsed text.
 * @param {string} base64Image - base64 string (with or without data URI prefix)
 * @returns {Promise<string>} extracted text
 */
async function extractTextFromImage(base64Image) {
  if (!base64Image) throw new Error("No image provided");

  // Ensure proper data URI format
  const base64Data = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  const formData = new FormData();
  formData.append("base64Image", base64Data);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");
  formData.append("OCREngine", "2"); // Engine 2 is better for IDs
  formData.append("apikey", OCR_SPACE_API_KEY);

  const response = await axios.post(OCR_SPACE_URL, formData, {
    headers: {
      apikey: OCR_SPACE_API_KEY,
      ...formData.getHeaders(),
    },
    timeout: 30000,
  });

  const result = response.data;

  if (result.IsErroredOnProcessing) {
    throw new Error(result.ErrorMessage?.[0] || "OCR processing failed");
  }

  const text = result.ParsedResults?.[0]?.ParsedText;
  if (!text || text.trim() === "") {
    throw new Error("OCR returned empty text. Try recapturing with better lighting.");
  }

  return text;
}

module.exports = { extractTextFromImage };