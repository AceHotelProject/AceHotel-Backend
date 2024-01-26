const httpStatus = require('http-status');
const { Hotel } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a hotel
 * @param {Object} hotelBody
 * @returns {Promise<Hotel>}
 */
const createHotel = async (hotelBody) => {
  return Hotel.create(hotelBody);
};

/**
 * Query for hotels
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryHotels = async (filter, options) => {
  const hotels = await Hotel.paginate(filter, options);
  return hotels;
};

/**
 * Get hotel by id
 * @param {ObjectId} id
 * @returns {Promise<Hotel>}
 */
const getHotelById = async (id) => {
  return Hotel.findById(id);
};

/**
 * Update hotel by id
 * @param {ObjectId} hotelId
 * @param {Object} updateBody
 * @returns {Promise<Hotel>}
 */
const updateHotelById = async (hotelId, updateBody) => {
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  Object.assign(hotel, updateBody);
  await hotel.save();
  return hotel;
};

/**
 * Add inventory id to hotel
 * @param {ObjectId} hotelId
 * @param {ObjectId} inventoryId
 * @returns {null}
 */
const addInventoryId = async (hotelId, inventoryId) => {
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  hotel.inventory_id.push(inventoryId);
  await hotel.save();
  return;
};

/**
 * Delete hotel by id
 * @param {ObjectId} hotelId
 * @returns {Promise<Hotel>}
 */
const deleteHotelById = async (hotelId) => {
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  await hotel.remove();
  return hotel;
};
/**
 * Remove inventory id from hotel
 * @param {ObjectId} hotelId
 * @param {ObjectId} inventoryId
 * @returns {Promise<void>}
 */
const removeInventoryId = async (hotelId, inventoryId) => {
  const hotel = await getHotelById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }

  // Find the index of the inventoryId in the inventory_id array
  const index = hotel.inventory_id.indexOf(inventoryId);
  console.log(inventoryId, ' ', index);
  // If the inventoryId exists in the array, remove it
  if (index > -1) {
    hotel.inventory_id.splice(index, 1);
    await hotel.save();
  } else {
    // Handle the case where the inventoryId is not found in the array
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory ID not found in hotel');
  }
};

module.exports = {
  createHotel,
  queryHotels,
  getHotelById,
  updateHotelById,
  deleteHotelById,
  addInventoryId,
  removeInventoryId,
};
