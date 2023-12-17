const httpStatus = require('http-status');
const pick = require('../utils/pick');
const gcs = require('../utils/cloudStorage');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { hotelService, roomService } = require('../services');

const createHotel = catchAsync(async (req, res) => {
  const regularRoomImage = req.files.regular_room_image[0];
  req.body.regular_room_image_path = await gcs.upload(regularRoomImage);
  const exclusiveRoomImage = req.files.exclusive_room_image[0];
  req.body.exclusive_room_image_path = await gcs.upload(exclusiveRoomImage);
  const hotel = await hotelService.createHotel(req.body);
  // console.log(hotel);
  // Populate Some Rooms
  const regularRoomId = await roomService.populateRooms(hotel._id, {
    type: 'Regular',
    price: req.body.regular_room_price,
    image_path: req.body.regular_room_image_path,
    room_count: req.body.regular_room_count,
  });
  const exclusiveRoomId = await roomService.populateRooms(hotel._id, {
    type: 'Exclusive',
    price: req.body.exclusive_room_price,
    image_path: req.body.exclusive_room_image_path,
    room_count: req.body.exclusive_room_count,
  });
  // Assign Room to Hotel
  hotel.room_id = [...regularRoomId, ...exclusiveRoomId];
  await hotel.save();
  res.status(httpStatus.CREATED).send(hotel);
});

const getHotels = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await hotelService.queryHotels(filter, options);
  res.send(result);
});

const getHotel = catchAsync(async (req, res) => {
  const hotel = await hotelService.getHotelById(req.params.hotelId);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  res.send(hotel);
});

const updateHotel = catchAsync(async (req, res) => {
  const hotel = await hotelService.updateHotelById(req.params.hotelId, req.body);
  res.send(hotel);
});

const deleteHotel = catchAsync(async (req, res) => {
  await hotelService.deleteHotelById(req.params.hotelId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createHotel,
  getHotels,
  getHotel,
  updateHotel,
  deleteHotel,
};
