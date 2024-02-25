/* eslint-disable no-restricted-syntax, camelcase, no-plusplus, no-await-in-loop */

const httpStatus = require('http-status');
const { Booking } = require('../models');
const ApiError = require('../utils/ApiError');
const { hotelService } = require('.');

/**
 * Create a room
 * @param {Object} hotelBody
 * @returns {Promise<Hotel>}
 */
const createBooking = async (bookingBody) => {
  return Booking.create(bookingBody);
};

/**
 * Query for bookings
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryBookings = async (filter, options) => {
  const bookings = await Booking.paginate(filter, options);

  // Manually populate the visitor_id field for each result
  for (const booking of bookings.results) {
    await booking.populate('visitor_id', 'name').execPopulate();
  }
  return bookings;
};

/**
 * Get booking by id
 * @param {ObjectId} id
 * @returns {Promise<Booking>}
 */
const getBookingById = async (id) => {
  let booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  booking = booking.populate('visitor_id', 'name').execPopulate();
  return booking;
};

/**
 * Delete booking by id
 * @param {ObjectId} bookingId
 * @returns {Promise<Booking>}
 */

const deleteBookingById = async (bookingId) => {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  await booking.remove();
  return booking;
};

/**
 * Delete bookings by visitor id
 * @param {ObjectId} visitorId
 * @param {ObjectId} hotelId
 * @returns {Promise<Booking>}
 */

const deleteBookingsByVisitorId = async (visitorId) => {
  const bookings = await Booking.find({
    visitor_id: visitorId,
  });
  for (const b of bookings) {
    await b.remove();
  }
  return bookings;
};

const applyDiscount = async (bookingId, discountBody) => {
  let booking = await getBookingById(bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  const hotel = await hotelService.getHotelById(booking.hotel_id);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  if (discountBody.discount_code !== hotel.discount_code) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Discount code not found');
  }
  booking.total_price -= hotel.discount_amount * booking.room_count;
  await booking.save();
  booking = await booking.populate('visitor_id', 'name').execPopulate();
  return booking;
};
module.exports = {
  createBooking,
  queryBookings,
  getBookingById,
  deleteBookingById,
  deleteBookingsByVisitorId,
  applyDiscount,
};
