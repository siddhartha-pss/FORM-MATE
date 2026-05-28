const API_BASE = "/api/ocr";

/**
 * Sends a base64 image to the backend OCR endpoint.
 * @param {"aadhaar-front"|"aadhaar-back"|"pan"} type
 * @param {string} base64Image
 * @returns {Promise<{parsed: object, rawText: string}>}
 */
export async function runOCR(type, base64Image) {
  const response = await fetch(`${API_BASE}/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "OCR request failed");
  }

  return { parsed: data.parsed, rawText: data.rawText };
}