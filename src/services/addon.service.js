const httpStatus = require('http-status');
const { Addon } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a addon
 * @param {Object} addonBody
 * @returns {Promise<Addon>}
 */
const createAddon = async (addonBody) => {
  const addon = await Addon.create(addonBody);
  return addon;
};

/**
 * Query for addons
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryAddons = async (filter, options) => {
  const addons = await Addon.paginate(filter, options);
  return addons;
};

/**
 * Get addon by id
 * @param {ObjectId} id
 * @returns {Promise<Addon>}
 */
const getAddonById = async (id) => {
  return Addon.findById(id);
};

/**
 * Update addon by id
 * @param {ObjectId} addonId
 * @param {Object} updateBody
 * @returns {Promise<Addon>}
 */
const updateAddonById = async (addonId, updateBody) => {
  const addon = await getAddonById(addonId);
  if (!addon) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Addon not found');
  }
  Object.assign(addon, updateBody);
  await addon.save();
  return addon;
};

/**
 * Delete addon by id
 * @param {ObjectId} addonId
 * @returns {Promise<Addon>}
 */
const deleteAddonById = async (addonId) => {
  const addon = await getAddonById(addonId);
  if (!addon) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Addon not found');
  }
  await addon.remove();
  return addon;
};

module.exports = {
  createAddon,
  queryAddons,
  getAddonById,
  updateAddonById,
  deleteAddonById,
};
