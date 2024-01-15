/* eslint-disable no-restricted-syntax, camelcase, no-plusplus, no-await-in-loop */

const httpStatus = require('http-status');
const { Room } = require('../models');
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
  const roomIds = [];

  for (const roomData of roomDataArray) {
    const { type, price, room_count } = roomData;

    // Create rooms based on the room_count
    for (let i = 0; i < room_count; i++) {
      const room = new Room({
        hotel_id: hotelId,
        type: type.toLowerCase(), // Assuming your enum values are lowercase
        is_booked: false,
        is_clean: true,
        price,
      });

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

const getAvailableRoomsByType = async (type, hotelId, count) => {
  return Room.find({
    type: type.toLowerCase(),
    hotel_id: hotelId,
    is_booked: false,
  }).limit(count);
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
  getAvailableRoomsByType,
};
