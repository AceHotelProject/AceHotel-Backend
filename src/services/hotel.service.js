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
  return Hotel.findById(id).populate('room_id');
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
  if (updateBody.regular_room_price) {
    // eslint-disable-next-line no-restricted-syntax
    for (const room of hotel.room_id) {
      if (room.type === 'regular') {
        room.price = updateBody.regular_room_price;
        // eslint-disable-next-line no-await-in-loop
        await room.save();
      }
    }
  }
  if (updateBody.exclusive_room_price) {
    // eslint-disable-next-line no-restricted-syntax
    for (const room of hotel.room_id) {
      if (room.type === 'exclusive') {
        room.price = updateBody.exclusive_room_price;
        // eslint-disable-next-line no-await-in-loop
        await room.save();
      }
    }
  }
  await hotel.save();
  return hotel;
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

module.exports = {
  createHotel,
  queryHotels,
  getHotelById,
  updateHotelById,
  deleteHotelById,
};
