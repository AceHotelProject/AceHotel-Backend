const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { roomService, hotelService } = require('../services');

const createRoom = catchAsync(async (req, res) => {
  const {hotel_id, type} = req.body;
  const hotel = await hotelService.getHotelById(hotel_id);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  const updateField = type === 'regular' ? 'regular_room_count' : 'exclusive_room_count';
  const room = await roomService.createRoom(req.body);
  hotel[updateField] += 1;
  hotel.room_id.push(room._id);
  const updatedHotel = await hotel.save();
  res.status(httpStatus.CREATED).send(room);
});

const getRooms = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'type', 'hotel_id']);
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
  const hotel = await hotelService.getHotelById(room.hotel_id);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  const updateField = room.type === 'regular' ? 'regular_room_count' : 'exclusive_room_count';
  hotel[updateField] -= 1;
  hotel.room_id = hotel.room_id.filter((id) => id.toString() !== room._id.toString());
  await hotel.save();
  await roomService.deleteRoomById(req.params.roomId);
  res.status(httpStatus.NO_CONTENT).send();
});

const populateRooms = catchAsync(async (req, res) => {
  await roomService.populateRooms(req.params.hotelId, req.body);
  res.status(httpStatus.NO_CONTENT).send();
});

const getRoomsByHotelId = catchAsync(async (req, res) => {
  const result = await roomService.getRoomsByHotelId(req.params.hotelId);
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
  await roomService.deleteRoomByHotelId(req.params.hotelId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getAvailableRoomsByType = catchAsync(async (req, res) => {
  const result = await roomService.getAvailableRoomsByType(req.body.type, req.body.hotelId, req.body.count);
  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No available rooms found');
  }
  res.send(result);
});

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
};
