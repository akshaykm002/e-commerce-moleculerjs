const multer = require('multer');
const path = require('path');

// Configure storage options
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set the destination for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
  }
});

// Initialize Multer with the storage configuration
const upload = multer({ storage: storage });

module.exports = upload;
