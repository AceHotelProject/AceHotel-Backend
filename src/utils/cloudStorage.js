const storage = require('../config/gcs');

const upload = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const bucketName = 'ace-hotel';
      const bucket = storage.bucket(bucketName);

      // Extract file details
      const fileName = file.originalname;

      // Upload the file to Google Cloud Storage
      const gcsFile = bucket.file(fileName);
      const stream = gcsFile.createWriteStream();
      stream.end(file.buffer);

      // Handle successful upload
      stream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        resolve(publicUrl);
      });

      // Handle errors during upload
      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const deleteFile = async (fileUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const bucketName = 'ace-hotel';
      const bucket = storage.bucket(bucketName);
      const fileName = fileUrl.split('/').pop();
      const gcsFile = bucket.file(fileName);
      gcsFile.delete();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  upload,
  deleteFile,
};
