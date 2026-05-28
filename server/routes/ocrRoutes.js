const express = require("express");
const router = express.Router();
const { ocrAadhaarFront, ocrAadhaarBack, ocrPAN } = require("../controllers/ocrController");

router.post("/aadhaar-front", ocrAadhaarFront);
router.post("/aadhaar-back", ocrAadhaarBack);
router.post("/pan", ocrPAN);

module.exports = router;