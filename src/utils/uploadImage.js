const httpStatus = require('http-status');
const ApiError = require('./ApiError');
const gcs = require('./cloudStorage');

const uploadImage = async (image) => {
  try {
    const path = await gcs.upload(image);
    return path;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error);
  }
};

module.exports = {
  uploadImage,
};
