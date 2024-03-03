const httpStatus = require('http-status');
const { Tag } = require('../models');
const ApiError = require('../utils/ApiError');

const topic = 'mqtt-integration/Inventory/';

const timeOutValue = 5000;
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
  console.log(resultJson);
  const result = JSON.stringify(resultJson);
  req.mqttPublish(topic + req.params.readerId + '/rx', result);
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
  const commandJson = {
    method: 'getTag',
    params: '',
  };

  function generateRandomId(length = 10) {
    let tid = '';
    const characters = 'ABCDEF0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      tid += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return tid;
  }
  const dummyResponseJson = {
    tid: [generateRandomId()],
    status: '1',
  };

  const queryCommandJson = {
    method: 'setQuery',
    params: 'false',
  };
  let query = JSON.stringify(queryCommandJson);
  req.mqttPublish(topic + req.params.readerId + '/rx', query);
  const command = JSON.stringify(commandJson);

  // const dummy = JSON.stringify(dummyResponseJson);
  // req.mqttPublish(topicAdd, dummy);

  const messageString = await req.mqttWaitMessage(topic + req.params.readerId + '/add', timeOutValue); // 3 seconds timeout
  req.mqttPublish(topic + req.params.readerId + '/rx', command);
  // req.mqttUnsubscribe(topic + req.params.readerId + '/add');
  const messageObj = JSON.parse(messageString);
  if (!messageObj) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to parse JSON data');
  }
  let result;
  if (messageObj.status == 1) {
    result = {
      tagId: messageObj.tid,
      status: messageObj.status,
    };
  } else {
    result = {
      status: messageObj.status,
    };
  }
  queryCommandJson.params = 'true';
  query = JSON.stringify(queryCommandJson);
  req.mqttPublish(topic + req.params.readerId + '/rx', query);

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
