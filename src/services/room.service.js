/* eslint-disable no-restricted-syntax, camelcase, no-plusplus, no-await-in-loop */

const httpStatus = require('http-status');
const { Room, Booking, Hotel } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a room
 * @param {Object} hotelBody
 * @returns {Promise<Hotel>}
 */
const createRoom = async (roomBody) => {
  return Room.create(roomBody);
};

/**
 * Query for rooms
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryRooms = async (filter, options) => {
  const rooms = await Room.paginate(filter, options);
  return rooms;
};

/**
 * Get room by id
 * @param {ObjectId} id
 * @returns {Promise<Room>}
 */
const getRoomById = async (id) => {
  return Room.findById(id);
};

/**
 * Update room by id
 * @param {ObjectId} roomId
 * @param {Object} updateBody
 * @returns {Promise<Room>}
 */
const updateRoomById = async (roomId, updateBody) => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  Object.assign(room, updateBody);
  await room.save();
  return room;
};

/**
 * Delete hotel by id
 * @param {ObjectId} hotelId
 * @returns {Promise<Hotel>}
 */
const deleteRoomById = async (roomId) => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  await room.remove();
  return room;
};

/**
 * Populate rooms
 * @param {ObjectId} hotelId
 * @param {Object} updateBody
 * @returns {Promise<Hotel>}
 */
const populateRooms = async (hotelId, ...roomDataArray) => {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }

  const roomIds = [];

  let total_room = 0;
  if (hotel.room_id.length > 0) {
    total_room = hotel.room_id.length;
  }

  for (const roomData of roomDataArray) {
    const { type, price, room_count } = roomData;

    // Create rooms based on the room_count
    for (let i = 0; i < room_count; i++) {
      const room = new Room({
        name: `Kamar ${total_room + 1}`,
        hotel_id: hotelId,
        type: type.toLowerCase(), // Assuming your enum values are lowercase
        is_booked: false,
        is_clean: true,
        price,
      });
      total_room += 1;
      // Save the room to the database
      await room.save();

      // Add the room ID to the array
      roomIds.push(room._id);
    }
  }
  return roomIds;
};

const getRoomsByHotelId = async (hotelId) => {
  return Room.find({ hotel_id: hotelId });
};

const updateRoomByHotelId = async (hotelId, updateBody) => {
  const rooms = await getRoomsByHotelId(hotelId);
  if (!rooms) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  for (const room of rooms) {
    Object.assign(room, updateBody);
    await room.save();
  }
  return rooms;
};

const deleteRoomByHotelId = async (hotelId) => {
  const rooms = await getRoomsByHotelId(hotelId);
  if (!rooms) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  for (const room of rooms) {
    await room.remove();
  }
  return rooms;
};

const bookingRoomById = async (roomId, updateBody) => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  room.is_booked = updateBody.is_booked;
  room.bookings.push(updateBody.bookings);
  await room.save();
  return room;
};

const getAvailableRoomsByType = async (type, hotelId, count, checkin_date, checkout_date) => {
  const room = await Room.find({
    hotel_id: hotelId,
    type: type.toLowerCase(),
  });
  let availableRooms = [];
  for (const r of room) {
    let bookings = r.bookings.sort((a, b) => a.checkin_date - b.checkin_date);
    // checkin date : 20 Januari 2024
    // checkout date : 23 Januari 2024
    // avaliable ketika checkin baru < checkin date dan checkout baru < checkin date
    // available ketika checkin baru > checkout date dan checkout baru < checkin date booking selanjutnya
    if (r.bookings.length === 0 || r.bookings === undefined) {
      availableRooms.push(r);
    } else {
      for (let i = 0; i < r.bookings.length; i++) {
        bookings = r.bookings.sort((a, b) => a.checkin_date - b.checkin_date);
        if (
          (checkin_date < bookings[0].checkin_date && checkout_date < bookings[0].checkin_date) ||
          (checkin_date > bookings[i].checkout_date &&
            (r.bookings[i + 1] === undefined ? true : checkout_date < r.bookings[i + 1].checkin_date))
        ) {
          if (availableRooms[availableRooms.length - 1] !== r) {
            availableRooms.push(r);
          }
        }
      }
    }
  }
  // Cut the array to the count
  if (availableRooms.length < count) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No available rooms found');
  }
  availableRooms = availableRooms.slice(0, count);
  return availableRooms;
};

const checkinById = async (roomId, checkinBody, user_id) => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  const hotel = await Hotel.findById(room.hotel_id);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  if (!room.is_booked) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Room is not booked');
  }
  for (const book of room.bookings) {
    if (
      book.visitor_id.toString() === checkinBody.visitor_id.toString() &&
      book.booking_id.toString() === checkinBody.booking_id.toString()
    ) {
      const booking = await Booking.findById(book.booking_id);
      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
      }
      if (checkinBody.checkin_date < booking.checkin) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot checkin before checkin date');
      }
      if (!booking.actual_checkin || booking.actual_checkin === undefined) {
        hotel.revenue += booking.total_price;
      }
      booking.actual_checkin = checkinBody.checkin_date;
      booking.checkin_staff_id = user_id;
      await hotel.save();
      await booking.save();
      return room;
    }
  }
};

const checkoutById = async (roomId, checkoutBody, bookingId) => {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  if (!room.is_booked) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Room is not booked');
  }
  for (const book of room.bookings) {
    if (book.booking_id.toString() === bookingId.toString()) {
      room.bookings = room.bookings.filter((booking) => booking.booking_id.toString() !== bookingId.toString());
      break;
    }
  }
  room.is_booked = false;
  Object.assign(room, checkoutBody);
  await room.save();
  return room;
};

module.exports = {
  createRoom,
  queryRooms,
  getRoomById,
  updateRoomById,
  deleteRoomById,
  populateRooms,
  getRoomsByHotelId,
  updateRoomByHotelId,
  deleteRoomByHotelId,
  bookingRoomById,
  getAvailableRoomsByType,
  checkinById,
  checkoutById,
};
