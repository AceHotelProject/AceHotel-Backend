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
const getReaderByName = async (readerName) => {
  return Reader.findOne({ reader_name: readerName });
};

/**
 * Update reader by id
 * @param {ObjectId} readerName
 * @param {Object} updateBody
 * @returns {Promise<Reader>}
 */
const updateReaderByName = async (req) => {
  const { reader_name } = req.params;
  const updateBody = req.body;
  const reader = await getReaderByName(reader_name);
  if (!reader) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reader not found');
  }

  Object.assign(reader, updateBody);
  const addCommandJson = {
    method: 'getData',
    data: {
      tag_expired: reader.tag_expired,
      read_interval: reader.read_interval,
    },
  };
  const command = JSON.stringify(addCommandJson);
  req.mqttPublish(`Inventory/${reader_name}/rx`, command);
  await reader.save();
  return reader;
};

/**
 * Delete reader by id
 * @param {ObjectId} readerName
 * @returns {Promise<Reader>}
 */
const deleteReaderByName = async (readerName) => {
  const reader = await getReaderByName(readerName);
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
  getReaderById,
};
