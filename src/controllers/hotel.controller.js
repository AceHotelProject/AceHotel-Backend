const httpStatus = require('http-status');
const pick = require('../utils/pick');
const gcs = require('../utils/cloudStorage');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { hotelService, roomService, userService } = require('../services');

const createHotel = catchAsync(async (req, res) => {
  req.body.owner_id = req.user._id;

  req.body.regular_room_image_path = [];
  req.body.exclusive_room_image_path = [];
  for (const image of req.files.regular_room_image) {
    req.body.regular_room_image_path.push(await gcs.upload(image));
  }
  for (const image of req.files.exclusive_room_image) {
    req.body.exclusive_room_image_path.push(await gcs.upload(image));
  }


//   const regularRoomImage = req.files.regular_room_image[0];
//   req.body.regular_room_image_path = await gcs.upload(regularRoomImage);
//   const exclusiveRoomImage = req.files.exclusive_room_image[0];
//   req.body.exclusive_room_image_path = await gcs.upload(exclusiveRoomImage);

  const hotel = await hotelService.createHotel(req.body);
  // Populate Some Rooms
  userService.addHotelId(req.user._id, hotel._id);
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
  const hotel_id = req.user.hotel_id; // Return only hotel that user can access
  const filter = pick(req.query, ['name', 'owner_id']);
  const combinedFilter = {
    ...filter,
    _id: { $in: hotel_id },
  };

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await hotelService.queryHotels(combinedFilter, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No hotels found');
  }
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
  const hotel = await hotelService.getHotelById(req.params.hotelId);
  for (const room of hotel.room_id) {
    await roomService.deleteRoomById(room);
  }
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
