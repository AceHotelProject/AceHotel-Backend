/* eslint-disable no-restricted-syntax, camelcase, no-plusplus, no-await-in-loop */

const httpStatus = require('http-status');
const { Booking } = require('../models');
const ApiError = require('../utils/ApiError');

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
  return bookings;
};

/**
 * Get booking by id
 * @param {ObjectId} id
 * @returns {Promise<Booking>}
 */
const getBookingById = async (id) => {
  const booking = await Booking.findById(id);
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
 * Get bookings by visitor id
 * @param {ObjectId} visitorId
 * @param {ObjectId} hotelId
 * @returns {Promise<Booking>}
 */

const getBookingsByVisitorId = async (visitorId, hotelId) => {
  const bookings = await Booking.find({
    visitor_id: visitorId,
    hotel_id: hotelId,
  });
  return bookings;
};

/**
 * Delete bookings by visitor id
 * @param {ObjectId} visitorId
 * @param {ObjectId} hotelId
 * @returns {Promise<Booking>}
 */

const deleteBookingsByVisitorId = async (visitorId, hotelId) => {
  const bookings = await Booking.find({
    visitor_id: visitorId,
    hotel_id: hotelId,
  });
  for (const b of bookings) {
    await b.remove();
  }
  return bookings;
};

module.exports = {
  createBooking,
  queryBookings,
  getBookingById,
  deleteBookingById,
  getBookingsByVisitorId,
  deleteBookingsByVisitorId,
};
