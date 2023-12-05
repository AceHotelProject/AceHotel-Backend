const httpStatus = require('http-status');
const { Visitor } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a visitor
 * @param {Object} visitorBody
 * @returns {Promise<Visitor>}
 */
const createVisitor = async (visitorBody) => {
  return Visitor.create(visitorBody);
};

/**
 * Query for visitors
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryVisitors = async (filter, options) => {
  const visitors = await Visitor.paginate(filter, options);
  return visitors;
};

/**
 * Get visitor by id
 * @param {ObjectId} id
 * @returns {Promise<Visitor>}
 */
const getVisitorById = async (id) => {
  return Visitor.findById(id);
};

/**
 * Update visitor by id
 * @param {ObjectId} visitorId
 * @param {Object} updateBody
 * @returns {Promise<Visitor>}
 */
const updateVisitorById = async (visitorId, updateBody) => {
  const visitor = await getVisitorById(visitorId);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  Object.assign(visitor, updateBody);
  await visitor.save();
  return visitor;
};

/**
 * Delete user by id
 * @param {ObjectId} visitorId
 * @returns {Promise<Visitor>}
 */
const deleteVisitorById = async (visitorId) => {
  const visitor = await getVisitorById(visitorId);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  await visitor.remove();
  return visitor;
};

module.exports = {
  createVisitor,
  queryVisitors,
  getVisitorById,
  updateVisitorById,
  deleteVisitorById,
};
