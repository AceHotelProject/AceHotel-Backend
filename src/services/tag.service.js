const httpStatus = require('http-status');
const { Tag } = require('../models');
const ApiError = require('../utils/ApiError');
const mqtt = require('mqtt');
const topic = '/nodejs/mqtt/rx';
const host = '35.202.12.122';
const port = '1883';
const clientId = `backend-client`;

const connectUrl = `mqtt://${host}:${port}`;
/**
 * Create a tag
 * @param {Object} tagBody
 * @returns {Promise<Tag>}
 */
const createTag = async (tagBody) => {
  return Tag.create(tagBody);
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

const getTagId = async () => {
  const client = mqtt.connect(connectUrl, {
    clientId,
    username: 'backend-client',
    password: 'an1m3w1bu',
  });
  client.publish(topic, 'nodejs mqtt test', { qos: 0, retain: false }, (error) => {
    if (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error at adding tag');
    }
  });
  const result = {
    payload: 'done',
  };
  console.log(result);

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
  getTagId,
  createTag,
  queryTags,
  getTagById,
  updateTagById,
  deleteTagById,
};
