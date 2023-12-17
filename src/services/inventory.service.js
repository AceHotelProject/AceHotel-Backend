const httpStatus = require('http-status');
const { Inventory } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create an inventory
 * @param {Object} inventoryBody
 * @returns {Promise<Inventory>}
 */
const createInventory = async (inventoryBody) => {
  return Inventory.create(inventoryBody);
};

/**
 * Query for inventories
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryInventories = async (filter, options) => {
  const inventories = await Inventory.paginate(filter, options);
  return inventories;
};

/**
 * Get inventory by id
 * @param {ObjectId} id
 * @returns {Promise<Inventory>}
 */
const getInventoryById = async (id) => {
  return Inventory.findById(id);
};

/**
 * Update inventory by id
 * @param {ObjectId} inventoryId
 * @param {Object} updateBody
 * @returns {Promise<Inventory>}
 */
const updateInventoryById = async (inventoryId, updateBody) => {
  const inventory = await getInventoryById(inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory not found');
  }

  // Determine if there is a stock change
  const stockChange = updateBody.stock ? updateBody.stock - inventory.stock : 0;

  // Add a new record to inventory_update_history if there is relevant info
  if (updateBody.title || updateBody.description || stockChange !== 0) {
    inventory.inventory_update_history.push({
      title: updateBody.title,
      description: updateBody.description,
      stockChange: stockChange,
      date: new Date(), // This will set the date to the current date and time
    });
  }
  // Update inventory fields (name and type)
  if (updateBody.name) inventory.name = updateBody.name;
  if (updateBody.type) inventory.type = updateBody.type;
  if (updateBody.stock) inventory.stock = updateBody.stock;

  await inventory.save();
  return inventory;
};

/**
 * Delete inventory by id
 * @param {ObjectId} inventoryId
 * @returns {Promise<Inventory>}
 */
const deleteInventoryById = async (inventoryId) => {
  const inventory = await getInventoryById(inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory not found');
  }
  await inventory.remove();
  return inventory;
};

module.exports = {
  createInventory,
  queryInventories,
  getInventoryById,
  updateInventoryById,
  deleteInventoryById,
};
