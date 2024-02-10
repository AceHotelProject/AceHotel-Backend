const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { uploadImage } = require('../utils/uploadImage');

const uploadFiles = catchAsync(async (req, res) => {
  const path = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const file of req.files.image) {
    // eslint-disable-next-line no-await-in-loop
    path.push(await uploadImage(file));
  }
  res.status(httpStatus.OK).send({ path });
});

module.exports = {
  uploadFiles,
};
