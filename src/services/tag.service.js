const httpStatus = require('http-status');
const { Tag } = require('../models');
const ApiError = require('../utils/ApiError');

const timeOutValue = 5000;
/**
 * Create a tag
 * @param {Object} tagBody
 * @returns {Promise<Tag>}
 */
const createTag = async (tagBody) => {
  console.log(Tag);
  return Tag.create(tagBody);
};

/**
 * Set is query
 * @param {Bool} isQuery - Is Reader in Query mode
 */
const setQuery = async (req) => {
  const resultJson = {
    method: 'setQuery',
    params: req.query.state,
  };
  // console.log(resultJson);
  const result = JSON.stringify(resultJson);
  req.mqttPublish(`Inventory/${req.params.readerName}/rx`, result);
  return resultJson;
};

/**
 * Query for tags
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTags = async (filter, options) => {
  const tags = await Tag.paginate(filter, options);
  return tags;
};
/**
 * Get TID by publish to ESP32
 * @returns {Promise<Tag>}
 */

const getTagId = async (req) => {
  const addCommandJson = {
    method: 'getTag',
    params: '',
  };
  const command = JSON.stringify(addCommandJson);
  req.mqttPublish(`Inventory/${req.params.readerName}/rx`, command);
  // wait then publish
  const messageString = await req.mqttWaitMessage(`Inventory/${req.params.readerName}/tx`, timeOutValue); // 3 seconds timeout

  const messageObj = JSON.parse(messageString);
  if (!messageObj) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to parse JSON data');
  }
  let result;

  if (messageObj.status === '1' && messageObj.method === 'addTag') {
    result = {
      tagId: messageObj.tid,
      status: messageObj.status,
    };
  } else {
    result = {
      status: messageObj.status,
    };
  }

  return result;
};
/**
 * Get tag by id
 * @param {ObjectId} id
 * @returns {Promise<Tag>}
 */
const getTagById = async (id) => {
  return Tag.findById(id);
};
/**
 * Switch tag status by tid
 * @param {ObjectId} id
 * @returns {Promise<Tag>}
 */
const toggleTagStatus = async (tid) => {
  const tag = await Tag.findOne({ tid });
  if (!tag) {
    return null; // Return null to indicate no update needed
  }

  // Toggle the status
  tag.status = tag.status === 'IN' ? 'OUT' : 'IN';

  // Determine increment based on the new status
  const increment = tag.status === 'IN' ? 1 : -1;

  await tag.save();

  // Return the inventoryId and the increment value
  return { inventoryId: tag.inventory_id, increment };
};
/**
 * Update tag by id
 * @param {ObjectId} tagId
 * @param {Object} updateBody
 * @returns {Promise<Tag>}
 */
const updateTagById = async (tagId, updateBody) => {
  const tag = await getTagById(tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  Object.assign(tag, updateBody);
  await tag.save();
  return tag;
};

/**
 * Delete tag by id
 * @param {ObjectId} tagId
 * @returns {Promise<Tag>}
 */
const deleteTagById = async (tagId) => {
  const tag = await getTagById(tagId);
  console.log(tag);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  await tag.deleteOne();
  return tag;
};

module.exports = {
  setQuery,
  getTagId,
  createTag,
  queryTags,
  getTagById,
  toggleTagStatus,
  updateTagById,
  deleteTagById,
};
