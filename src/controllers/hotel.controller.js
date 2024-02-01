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
  // eslint-disable-next-line no-restricted-syntax
  for (const image of req.files.regular_room_image) {
    // eslint-disable-next-line no-await-in-loop
    req.body.regular_room_image_path.push(await gcs.upload(image));
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const image of req.files.exclusive_room_image) {
    // eslint-disable-next-line no-await-in-loop
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
  const owner = await userService.createUser({
    username: req.body.owner_name,
    email: req.body.owner_email,
    password: req.body.owner_password,
    role: 'branch_manager',
  });
  hotel.owner_id = owner._id;
  const receptionist = await userService.createUser({
    username: req.body.receptionist_name,
    email: req.body.receptionist_email,
    password: req.body.receptionist_password,
    role: 'receptionist',
  });
  hotel.receptionist_id = receptionist._id;
  const cleaningStaff = await userService.createUser({
    username: req.body.cleaning_staff_name,
    email: req.body.cleaning_staff_email,
    password: req.body.cleaning_staff_password,
    role: 'cleaning_staff',
  });
  hotel.cleaning_staff_id = cleaningStaff._id;
  const inventoryStaff = await userService.createUser({
    username: req.body.inventory_staff_name,
    email: req.body.inventory_staff_email,
    password: req.body.inventory_staff_password,
    role: 'inventory_staff',
  });
  hotel.inventory_staff_id = inventoryStaff._id;
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
  // eslint-disable-next-line no-restricted-syntax
  for (const room of hotel.room_id) {
    // eslint-disable-next-line no-await-in-loop
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
