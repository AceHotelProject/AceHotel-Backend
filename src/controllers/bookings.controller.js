const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { bookingService, roomService } = require('../services');

const createBooking = catchAsync(async (req, res) => {
  req.body.room_id = roomService.getAvailableRoomsByType(req.body.type, req.body.hotel_id, req.body.room_count);
  checkout_date = new Date(req.body.checkin_date + req.body.duration * 24 * 60 * 60 * 1000);
  total_price = req.body.room_count * req.body.room_id[0].price * req.body.duration;
  if (req.body.add_on_id) {
    for (const add_on_id of req.body.add_on_id) {
      const add_on = await addOnService.getAddOnById(add_on_id);
      total_price += add_on.price;
    }
  }
  const booking = await bookingService.createBooking(req.body);
  res.status(httpStatus.CREATED).send(booking);
});

const getBookings = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['checkin_date', 'visitor_id', 'hotel_id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await bookingService.queryBookings(filter, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No booking found');
  }
  res.send(result);
});

const getBookingById = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  res.send(booking);
});

const updateBookingById = catchAsync(async (req, res) => {
  const booking = await bookingService.updateBookingById(req.params.bookingId, req.body);
  res.send(booking);
});

const deleteBookingById = catchAsync(async (req, res) => {
  await bookingService.deleteBookingById(req.params.bookingId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getBookingsByVisitorId = catchAsync(async (req, res) => {
  const result = await bookingService.getBookingsByVisitorId(req.params.visitorId);
  res.send(result);
});

const updateBookingByVisitorId = catchAsync(async (req, res) => {
  const result = await roomService.updateRoomByHotelId(req.params.visitorId, req.body);
  res.send(result);
});

const deleteBookingByVisitorId = catchAsync(async (req, res) => {
  await bookingService.deleteBookingByVisitorId(req.params.visitorId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingById,
  deleteBookingById,
  getBookingsByVisitorId,
  updateBookingByVisitorId,
  deleteBookingByVisitorId,
};
