const httpStatus = require('http-status');
const { Reader } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a reader
 * @param {Object} readerBody
 * @returns {Promise<Reader>}
 */
const createReader = async (readerBody) => {
  if (await Reader.isNameTaken(readerBody.reader_name)) {
    // Consider replacing this with more meaningful logging or remove it.
    throw new ApiError(httpStatus.BAD_REQUEST, 'Name already taken');
  }
  return Reader.create(readerBody);
};

/**
 * Query for readers
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryReaders = async (filter, options) => {
  const readers = await Reader.paginate(filter, options);
  return readers;
};

/**
 * Get reader by id
 * @param {ObjectId} id
 * @returns {Promise<Reader>}
 */
const getReaderById = async (id) => {
  return Reader.findById(id);
};

/**
 * Get reader by email
 * @param {string} name
 * @returns {Promise<Reader>}
 */
const getReaderByName = async (name) => {
  return Reader.findOne({ name });
};

/**
 * Update reader by id
 * @param {ObjectId} readerName
 * @param {Object} updateBody
 * @returns {Promise<Reader>}
 */
const updateReaderByName = async (readerName, updateBody) => {
  const reader = await getReaderByName(readerName);
  if (!reader) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reader not found');
  }
  Object.assign(reader, updateBody);
  await reader.save();
  return reader;
};

/**
 * Delete reader by id
 * @param {ObjectId} readerName
 * @returns {Promise<Reader>}
 */
const deleteReaderByName = async (readerName) => {
  const reader = await getReaderById(readerName);
  if (!reader) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reader not found');
  }
  await reader.remove();
  return reader;
};

module.exports = {
  createReader,
  queryReaders,
  getReaderByName,
  updateReaderByName,
  deleteReaderByName,
};
