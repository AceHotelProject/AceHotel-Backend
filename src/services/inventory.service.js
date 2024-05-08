const httpStatus = require('http-status');
const { Inventory } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create an inventory
 * @param {Object} inventoryBody
 * @returns {Promise<Inventory>}
 */
const createInventory = async (inventoryBody, user) => {
  const newInventory = {
    name: inventoryBody.name,
    type: inventoryBody.type,
    stock: inventoryBody.stock,
    inventory_update_history: {
      title: 'Penambahan bahan',
      description: 'Awal penambahan barang baru dalam gudang',
      personInCharge: user.username,
      // 'date' will automatically be set to Date.now
      stockChange: inventoryBody.stock, // Assuming initial stock change is 0
    },
  };

  return Inventory.create(newInventory);
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
 * Get inventory history by key
 * @param {ObjectId} id
 * @returns {Promise<Inventory>}
 */
const getInventoryHistories = async (id, keywords) => {
  const inventory = await getInventoryById(id);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory not found');
  }
  // Create a regular expression for case-insensitive matching
  const regex = new RegExp(keywords, 'i');

  // Filter the `inventory_update_history` array with the regex
  const history = inventory.inventory_update_history.filter(
    (historyItem) => regex.test(historyItem.title) || regex.test(historyItem.personInCharge)
  );

  if (history.length === 0) {
    // Check if any history items matched the keywords
    throw new ApiError(httpStatus.NOT_FOUND, 'History not found');
  }

  return history;
};

/**
 * Update inventory by id
 * @param {ObjectId} inventoryId
 * @param {Object} updateBody
 * @returns {Promise<Inventory>}
 */
const updateInventoryById = async (inventoryId, updateBody, user) => {
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

      personInCharge: user.username,
      stockChange,

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
 * Update inventory by id
 * @param {ObjectId} inventoryId
 * @param {Object} updateBody
 * @returns {Promise<Inventory>}
 */
const updateInventoryByReader = async (updateList) => {
  Object.entries(updateList).forEach(async ([id, count]) => {
    // console.log(`ID: ${id}, Count: ${count}`);
    const inventory = await getInventoryById(id);
    inventory.stock += count;
    inventory.inventory_update_history.push({
      title: 'Auto update',
      description: 'Auto update dari pembacaan reader',
      personInCharge: 'Reader',
      stockChange: count,
      date: new Date(), // This will set the date to the current date and time
    });
    await inventory.save();
    return inventory;
  });

  // // Determine if there is a stock change
  // const stockChange = updateBody.stock ? updateBody.stock - inventory.stock : 0;

  // // Add a new record to inventory_update_history if there is relevant info
  // if (updateBody.title || updateBody.description || stockChange !== 0) {
  //   inventory.inventory_update_history.push({
  //     title: updateBody.title,
  //     description: updateBody.description,

  //     personInCharge: user.username,
  //     stockChange,

  //     date: new Date(), // This will set the date to the current date and time
  //   });
  // }
  // // Update inventory fields (name and type)
  // if (updateBody.name) inventory.name = updateBody.name;
  // if (updateBody.type) inventory.type = updateBody.type;
  // if (updateBody.stock) inventory.stock = updateBody.stock;

  // await inventory.save();
  // return inventory;
};
/**
 * Add tag id to inventory
 * @param {ObjectId} inventoryId
 * @param {ObjectId} tagId
 * @returns {null}
 */
const addTagId = async (inventoryId, tagId) => {
  const inventory = await getInventoryById(inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory not found');
  }
  inventory.tag_id.push(tagId);
  await inventory.save();
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
  updateInventoryByReader,
  deleteInventoryById,
  getInventoryHistories,
  addTagId,
};
