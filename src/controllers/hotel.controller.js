const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { hotelService, roomService, userService } = require('../services');
const { deleteFile } = require('../utils/cloudStorage');

const createHotel = catchAsync(async (req, res) => {
  const owner = await userService.createUser({
    username: req.body.owner_name,
    email: req.body.owner_email,
    password: req.body.owner_password,
    role: 'branch_manager',
  });
  const receptionist = await userService.createUser({
    username: req.body.receptionist_name,
    email: req.body.receptionist_email,
    password: req.body.receptionist_password,
    role: 'receptionist',
  });
  const cleaningStaff = await userService.createUser({
    username: req.body.cleaning_staff_name,
    email: req.body.cleaning_staff_email,
    password: req.body.cleaning_staff_password,
    role: 'cleaning_staff',
  });
  const inventoryStaff = await userService.createUser({
    username: req.body.inventory_staff_name,
    email: req.body.inventory_staff_email,
    password: req.body.inventory_staff_password,
    role: 'inventory_staff',
  });
  const hotel = await hotelService.createHotel(req.body);
  // Populate Some Rooms
  userService.addHotelId(req.user._id, hotel._id);
  const regularRoomId = await roomService.populateRooms(hotel._id, {
    type: 'Regular',
    price: req.body.regular_room_price,
    image_path: req.body.regular_room_image_path,
    room_count: req.body.regular_room_count,
  });
  hotel.room_id.push(...regularRoomId);
  await hotel.save();
  const exclusiveRoomId = await roomService.populateRooms(hotel._id, {
    type: 'Exclusive',
    price: req.body.exclusive_room_price,
    image_path: req.body.exclusive_room_image_path,
    room_count: req.body.exclusive_room_count,
  });
  hotel.room_id.push(...exclusiveRoomId);
  hotel.owner_id = owner._id;
  hotel.receptionist_id = receptionist._id;
  hotel.cleaning_staff_id = cleaningStaff._id;
  hotel.inventory_staff_id = inventoryStaff._id;
  owner.hotel_id.push(hotel._id);
  receptionist.hotel_id.push(hotel._id);
  cleaningStaff.hotel_id.push(hotel._id);
  inventoryStaff.hotel_id.push(hotel._id);
  await owner.save();
  await receptionist.save();
  await cleaningStaff.save();
  await inventoryStaff.save();
  await hotel.save();
  res.status(httpStatus.CREATED).send(hotel);
});

const getHotels = catchAsync(async (req, res) => {
  // eslint-disable-next-line camelcase
  const { hotel_id } = req.user; // Return only hotel that user can access
  const filter = pick(req.query, ['owner_id']);
  const nameFilter = req.query.name ? { name: { $regex: new RegExp(req.query.name, 'i') } } : {};
  const combinedFilter = {
    ...filter,
    _id: { $in: hotel_id },
  };

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await hotelService.queryHotels({ ...combinedFilter, ...nameFilter }, options);
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
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(hotel._id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  res.send(hotel);
});

const updateHotel = catchAsync(async (req, res) => {
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
    if (!req.user.hotel_id.includes(hotel._id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  if (req.body.exclusive_room_image_path) {
    // eslint-disable-next-line no-restricted-syntax
    for (const file of hotel.exclusive_room_image_path) {
      // eslint-disable-next-line no-await-in-loop
      await deleteFile(file);
    }
  }
  if (req.body.regular_room_image_path) {
    // eslint-disable-next-line no-restricted-syntax
    for (const file of hotel.regular_room_image_path) {
      // eslint-disable-next-line no-await-in-loop
      await deleteFile(file);
    }
  }
  const updatedHotel = await hotelService.updateHotelById(req.params.hotelId, req.body);
  res.send(updatedHotel);
});

const deleteHotel = catchAsync(async (req, res) => {
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
    if (!req.user.hotel_id.includes(hotel._id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const room of hotel.room_id) {
    // eslint-disable-next-line no-await-in-loop
    await roomService.deleteRoomById(room);
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const file of hotel.exclusive_room_image_path) {
    // eslint-disable-next-line no-await-in-loop
    await deleteFile(file);
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const file of hotel.regular_room_image_path) {
    // eslint-disable-next-line no-await-in-loop
    await deleteFile(file);
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
