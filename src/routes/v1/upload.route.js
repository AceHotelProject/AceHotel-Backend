const express = require('express');
const multer = require('multer');
const auth = require('../../middlewares/auth');
const uploadController = require('../../controllers/upload.controller');

const multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
});

const router = express.Router();

router
  .route('/')
  .post(auth('uploadFiles'), multerConfig.fields([{ name: 'image', maxCount: 3 }]), uploadController.uploadFiles);

module.exports = router;
