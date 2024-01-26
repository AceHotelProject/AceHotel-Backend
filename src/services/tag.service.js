const httpStatus = require('http-status');
const { Tag } = require('../models');
const ApiError = require('../utils/ApiError');

const topic = '/nodejs/mqtt/rx';

/**
 * Create a tag
 * @param {Object} tagBody
 * @returns {Promise<Tag>}
 */
const createTag = async (tagBody) => {
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
  const result = JSON.stringify(resultJson);
  req.mqttPublish(topic, result);
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
  let result;
  const commandJson = {
    method: 'getTag',
    params: '',
  };
  // const dummyResponseJson = {
  //   tid: ['FF2428302'],
  //   status: '1',
  // };

  let queryCommandJson = {
    method: 'setQuery',
    params: 'false',
  };
  let query = JSON.stringify(queryCommandJson);
  req.mqttPublish(topic, query);
  const command = JSON.stringify(commandJson);
  req.mqttPublish(topic, command);
  // const dummy = JSON.stringify(dummyResponseJson);
  // req.mqttPublish(topic, dummy);

  req.mqttSubscribe(topic, function (message) {
    console.log('Received message: ' + message);
    const messageObj = JSON.parse(message);
    if (!messageObj) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Fail to parse JSON data');
      return;
    }
    // Access the 'status' field from the parsed object
    const status = messageObj.status;

    if (status == '1') {
      result = {
        tagId: messageObj.tid,
        status: status,
      };
    }
  });
  queryCommandJson.params = 'true';
  query = JSON.stringify(queryCommandJson);
  req.mqttPublish(topic, query);
  return JSON.stringify(result);
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
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  await tag.remove();
  return tag;
};

module.exports = {
  setQuery,
  getTagId,
  createTag,
  queryTags,
  getTagById,
  updateTagById,
  deleteTagById,
};
