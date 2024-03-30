const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { readerService } = require('../services');

const createReader = catchAsync(async (req, res) => {
  const reader = await readerService.createReader(req.body);
  res.status(httpStatus.CREATED).send(reader);
});

const getReaders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['reader_name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await readerService.queryReaders(filter, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No readers found');
  }
  res.send(result);
});

const getReader = catchAsync(async (req, res) => {
  const reader = await readerService.getReaderByName(req.params.reader_name);
  if (!reader) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reader not found');
  }
  res.send(reader);
});

const updateReader = catchAsync(async (req, res) => {
  const reader = await readerService.updateReaderByName(req.params.reader_name, req.body);
  res.send(reader);
});

const deleteReader = catchAsync(async (req, res) => {
  await readerService.deleteReaderByName(req.params.reader_name);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createReader,
  getReaders,
  getReader,
  updateReader,
  deleteReader,
};
