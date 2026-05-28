const express = require('express');
const multer = require('multer');
const router = express.Router();
const { registerUser } = require('../controllers/userController');
const { registerFacesForUser } = require('../controllers/faceController');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are accepted.'), false);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post('/register', registerUser);
router.post('/enroll-faces', upload.any(), registerFacesForUser);

module.exports = router;
