/**
 * Parses raw OCR text from Aadhaar Front, Aadhaar Back, and PAN card.
 */

function parseAadhaarFront(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result = {};

  // Full Name — filter out document labels and extract actual name
  const documentLabels = /^(AADHAR|AADHAAR|UID|UIDAI|GOVERNMENT|INDIA|DOB|GENDER|SIGNATURE|ADDRESS|MOBILE|EMAIL|UIN)$/i;
  const nameLine = lines.find((l) =>
    /^[A-Z][a-zA-Z\s]{3,40}$/.test(l) && 
    !/^\d/.test(l) && 
    !documentLabels.test(l) &&
    !/^(MINISTRY|DEPARTMENT|REPUBLIC)/.test(l)
  );
  if (nameLine) result.fullName = nameLine.trim();

  // DOB — formats: DD/MM/YYYY, DD/MM/YY, DD-MM-YYYY, or DD-MM-YY
  const dobMatch = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})\b/);
  if (dobMatch) result.dob = dobMatch[1];

  // Gender
  if (/\bMALE\b/i.test(text)) result.gender = "Male";
  else if (/\bFEMALE\b/i.test(text)) result.gender = "Female";

  // Aadhaar Number — 12 digits, possibly spaced: XXXX XXXX XXXX
  const aadhaarMatch = text.match(/\b(\d{4}\s\d{4}\s\d{4}|\d{12})\b/);
  if (aadhaarMatch) result.aadhaarNumber = aadhaarMatch[1].replace(/\s/g, "");

  return result;
}

function parseAadhaarBack(text) {
  const result = {};

  // Address — everything after "Address:" or "S/O" / "C/O" / "W/O"
  const addressMatch = text.match(/(?:Address|S\/O|C\/O|W\/O)[:\s]*([\s\S]{10,200})/i);
  if (addressMatch) {
    result.address = addressMatch[1].replace(/\n/g, ", ").trim();
  }

  // Pincode — 6-digit number
  const pinMatch = text.match(/\b(\d{6})\b/);
  if (pinMatch) result.pincode = pinMatch[1];

  // Parse city and state from address if available
  if (result.address) {
    // Common Indian states — try to find state name in address
    const states = [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
      "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
      "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
      "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
      "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Puducherry", "Chandigarh"
    ];
    
    for (const state of states) {
      if (new RegExp(state, "i").test(result.address)) {
        result.state = state;
        break;
      }
    }
    
    // Extract city — often appears before state or after first comma
    const addressParts = result.address.split(",").map((p) => p.trim());
    if (addressParts.length >= 2) {
      // City is typically the second or third part
      result.city = addressParts[addressParts.length - (result.state ? 2 : 3)] || "";
    }
  }

  return result;
}

function parsePAN(text) {
  const result = {};

  // PAN Number — format: AAAAA9999A (5 letters, 4 digits, 1 letter)
  const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  if (panMatch) result.panNumber = panMatch[1];

  // Name on PAN — line after "Name" label or all-caps line
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const nameIdx = lines.findIndex((l) => /^name$/i.test(l));
  if (nameIdx !== -1 && lines[nameIdx + 1]) {
    result.fullName = lines[nameIdx + 1];
  } else {
    const capsLine = lines.find((l) => /^[A-Z\s]{5,40}$/.test(l));
    if (capsLine) result.fullName = capsLine;
  }

  // DOB on PAN — format: DD/MM/YYYY
  const dobMatch = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  if (dobMatch) result.dob = dobMatch[1];

  return result;
}

/**
 * Merges data from all three captures, with PAN and Aadhaar front taking priority.
 */
function mergeOCRData(aadhaarFrontData, aadhaarBackData, panData) {
  return {
    fullName: aadhaarFrontData.fullName || panData.fullName || "",
    dob: aadhaarFrontData.dob || panData.dob || "",
    gender: aadhaarFrontData.gender || "",
    aadhaarNumber: aadhaarFrontData.aadhaarNumber || "",
    panNumber: panData.panNumber || "",
    address: aadhaarBackData.address || "",
    city: aadhaarBackData.city || "",
    state: aadhaarBackData.state || "",
    pincode: aadhaarBackData.pincode || "",
  };
}

module.exports = { parseAadhaarFront, parseAadhaarBack, parsePAN, mergeOCRData };