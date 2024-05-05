const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { roomService, hotelService, noteService, bookingService } = require('../services');

const createRoom = catchAsync(async (req, res) => {
  // eslint-disable-next-line camelcase
  const { hotel_id, type } = req.body;
  const hotel = await hotelService.getHotelById(hotel_id);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  const updateField = type === 'regular' ? 'regular_room_count' : 'exclusive_room_count';
  const room = await roomService.createRoom(req.body);
  hotel[updateField] += 1;
  hotel.room_id.push(room._id);
  await hotel.save();
  res.status(httpStatus.CREATED).send(room);
});

const getRooms = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['type', 'hotel_id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await roomService.queryRooms(filter, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No rooms found');
  }
  res.send(result);
});

const getRoom = catchAsync(async (req, res) => {
  const room = await roomService.getRoomById(req.params.roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(room.hotel_id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  res.send(room);
});

const updateRoom = catchAsync(async (req, res) => {
  const room = await roomService.updateRoomById(req.params.roomId, req.body);
  res.send(room);
});

const deleteRoom = catchAsync(async (req, res) => {
  const room = await roomService.getRoomById(req.params.roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(room.hotel_id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const booking of room.bookings) {
    if (booking.actual_checkout === null || booking.actual_checkout === undefined) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room has Booking that not checkout yet');
    }
  }
  const hotel = await hotelService.getHotelById(room.hotel_id);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  // hotel.room_id = hotel.room_id.filter((h) => h._id.toString() !== room._id.toString());
  await roomService.deleteRoomById(req.params.roomId);
  const updateField = room.type === 'regular' ? 'regular_room_count' : 'exclusive_room_count';
  hotel[updateField] -= 1;
  await hotel.save();
  res.status(httpStatus.NO_CONTENT).send();
});

const populateRooms = catchAsync(async (req, res) => {
  await roomService.populateRooms(req.params.hotelId, req.body);
  res.status(httpStatus.NO_CONTENT).send();
});

const getRoomsByHotelId = catchAsync(async (req, res) => {
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(req.params.hotelId)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  let filter = pick(req.query, ['type']);
  filter = { ...filter, hotel_id: req.params.hotelId };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await roomService.queryRooms(filter, options);
  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No rooms found');
  }
  res.send(result);
});

const updateRoomByHotelId = catchAsync(async (req, res) => {
  const result = await roomService.updateRoomByHotelId(req.params.hotelId, req.body);
  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No rooms found');
  }
  res.send(result);
});

const deleteRoomByHotelId = catchAsync(async (req, res) => {
  const hotel = await hotelService.getHotelById(req.params.hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(req.params.hotelId)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  // await roomService.deleteRoomByHotelId(req.params.hotelId);
  hotel.room_id = [];
  hotel.regular_room_count = 0;
  hotel.exclusive_room_count = 0;
  await hotel.save();
  res.status(httpStatus.NO_CONTENT).send();
});

const getAvailableRoomsByType = catchAsync(async (req, res) => {
  const result = await roomService.getAvailableRoomsByType(req.body.type, req.body.hotelId, req.body.count);
  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No available rooms found');
  }
  res.send(result);
});

const checkinById = catchAsync(async (req, res) => {
  const room = await roomService.checkinById(req.params.roomId, req.body, req.user._id);
  if (!room) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Checkin Error');
  }
  res.send(room);
});

const checkoutById = catchAsync(async (req, res) => {
  let room = await roomService.getRoomById(req.params.roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  let bookingId;
  // eslint-disable-next-line no-restricted-syntax
  for (const book of room.bookings) {
    if (
      book.visitor_id.toString() === req.body.visitor_id.toString() &&
      book.booking_id.toString() === req.body.booking_id.toString()
    ) {
      // eslint-disable-next-line no-await-in-loop
      const booking = await bookingService.getBookingById(req.body.booking_id);
      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
      }
      if (req.body.note) {
        // eslint-disable-next-line no-await-in-loop
        const note = await noteService.createNote({
          detail: req.body.note,
          booking_id: booking._id,
        });
        // eslint-disable-next-line no-restricted-syntax
        for (const r of booking.room) {
          if (r.id.toString() === req.params.roomId.toString()) {
            r.note_id = note._id;
            r.has_problem = true;
          }
        }
      }
      req.body.checkout_date = new Date(req.body.checkout_date);
      req.body.checkout_date.setHours(12, 0, 0, 0);
      // eslint-disable-next-line no-restricted-syntax
      for (const r of booking.room) {
        if (r.id.toString() === req.params.roomId.toString()) {
          // Validasi checkout date
          // if (req.body.checkout_date < booking.checkin_date || req.body.checkout_date > booking.checkout_date) {
          //   throw new ApiError(httpStatus.BAD_REQUEST, 'Checkout date must be between checkin date and checkout date');
          // }
          r.actual_checkout = new Date(req.body.checkout_date);
          const now = new Date();
          const currentHour = now.getHours() + 7;
          const currentMinute = now.getMinutes();
          const currentSecond = now.getSeconds();
          const currentMillisecond = now.getMilliseconds();
          r.actual_checkout.setHours(currentHour, currentMinute, currentSecond, currentMillisecond);
          r.checkout_staff_id = req.user._id;
        }
      }
      // eslint-disable-next-line no-await-in-loop
      await booking.save();
      bookingId = booking._id;
    }
  }
  room = await roomService.checkoutById(req.params.roomId, req.body, bookingId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  res.send(room);
});

// const getDataForCheckin = catchAsync(async (req, res) => {
// })
module.exports = {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  populateRooms,
  getRoomsByHotelId,
  updateRoomByHotelId,
  deleteRoomByHotelId,
  getAvailableRoomsByType,
  checkinById,
  checkoutById,
};
