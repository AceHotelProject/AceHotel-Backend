const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { bookingService, roomService, hotelService, visitorService, addonService } = require('../services');
const { deleteFile } = require('../utils/cloudStorage');

const createBooking = catchAsync(async (req, res) => {
  // Cek Hotel ID
  const hotel = await hotelService.getHotelById(req.body.hotel_id);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  // Cek Visitor ID
  const visitor = await visitorService.getVisitorById(req.body.visitor_id);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  if (!req.user.hotel_id.includes(hotel._id.toString())) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  if (visitor.hotel_id.toString() !== hotel._id.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  // Checkin Date Harus Jam 14:00
  const checkinDate = new Date(req.body.checkin_date);
  checkinDate.setHours(14, 0, 0, 0); // Set checkin time to 14:00
  req.body.checkin_date = checkinDate;
  // Hitung Tanggal Checkout Berdasarkan Tanggal Checkin dan Durasi (checkout harus pada jam 12:00)
  const checkoutDate = new Date(checkinDate);
  checkoutDate.setDate(checkinDate.getDate() + req.body.duration);
  checkoutDate.setHours(12, 0, 0, 0); // Set checkout time to 12:00
  req.body.checkout_date = checkoutDate;
  // Pilih Room Yang Tersedia (Berdasarkan Tipe Kamar dan Tanggal Checkin dan Checkout)
  req.body.room = await roomService.getAvailableRoomsByType(
    req.body.type,
    req.body.hotel_id,
    req.body.room_count,
    req.body.checkin_date,
    req.body.checkout_date
  );
  if (req.body.room.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No available room');
  }
  // Buat Booking
  const booking = await bookingService.createBooking(req.body);
  // Update Room Yang Dipilih Menjadi Booked
  // eslint-disable-next-line camelcase, no-restricted-syntax
  for (const room of req.body.room) {
    // eslint-disable-next-line no-await-in-loop
    await roomService.bookingRoomById(room.id, {
      is_booked: true,
      bookings: {
        booking_id: booking._id,
        visitor_id: req.body.visitor_id,
        checkin_date: req.body.checkin_date,
        checkout_date: req.body.checkout_date,
      },
    });
  }
  // Ambil Harga Room
  const room = await roomService.getRoomById(req.body.room[0].id);
  // Jika Ada Add On, Buat Add On
  if (req.body.extra_bed) {
    // eslint-disable-next-line camelcase
    const add_on_id = [];
    for (let i = 0; i < req.body.extra_bed; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const addon = await addonService.createAddon({
        name: 'Extra Bed',
        booking_id: booking._id,
        type: 'kasur',
        price: hotel.extra_bed_price,
      });
      add_on_id.push(addon._id);
    }
    // eslint-disable-next-line camelcase
    booking.add_on_id = add_on_id;
  } else {
    req.body.extra_bed = 0;
  }
  // Hitung Total Harga
  booking.total_price = req.body.room_count * room.price * req.body.duration + req.body.extra_bed * hotel.extra_bed_price;
  // Save
  await booking.save();
  res.status(httpStatus.CREATED).send(booking);
});

const payBooking = catchAsync(async (req, res) => {
  // Cek Booking ID
  let booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  if (!req.user.hotel_id.includes(booking.hotel_id.toString())) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  booking.path_transaction_proof = req.body.path_transaction_proof;
  // Update is_proof_uploaded
  booking.is_proof_uploaded = true;
  // Save
  booking = await booking.save();
  booking = await booking.populate('visitor_id', 'name').execPopulate();
  res.status(httpStatus.OK).send(booking);
});

const setCheckinTime = (date) => {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date provided');
  }

  // Set the time to 14:00:00
  date.setHours(14, 0, 0, 0);
  return date;
};

const getBookings = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['checkin_date', 'visitor_id', 'hotel_id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (filter.checkin_date) {
    // You may want to validate the date format or handle any parsing issues here
    // For simplicity, assuming the date format is valid ISO 8601
    const fullDate = new Date(filter.checkin_date);

    // Check the length of the provided date string
    if (filter.checkin_date.length === 4) {
      // If only the year is provided, set the filter to cover the entire year
      const startOfYear = new Date(fullDate.getFullYear(), 0, 1);
      const endOfYear = new Date(fullDate.getFullYear() + 1, 0, 1);

      // Set the time to 14:00:00
      startOfYear.setHours(14, 0, 0, 0);
      endOfYear.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfYear,
        $lt: endOfYear,
      };
    } else if (filter.checkin_date.length === 7) {
      // If year and month are provided, set the filter to cover the entire month
      const startOfMonth = new Date(fullDate.getFullYear(), fullDate.getMonth(), 1);
      const endOfMonth = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 1);

      // Set the time to 14:00:00
      startOfMonth.setHours(14, 0, 0, 0);
      endOfMonth.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfMonth,
        $lt: endOfMonth,
      };
    } else {
      // If the full date is provided, set the time to 14:00:00
      filter.checkin_date = setCheckinTime(fullDate);
    }
  }
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
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(booking.hotel_id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  res.send(booking);
});

const updateBookingById = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(booking.hotel_id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  if (req.body.path_transaction_proof) {
    await deleteFile(booking.path_transaction_proof);
  }
  const updatedBooking = await bookingService.updateBookingById(req.params.bookingId, req.body);
  res.send(updatedBooking);
});

const deleteBookingById = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(booking.hotel_id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  if (booking.path_transaction_proof) {
    await deleteFile(booking.path_transaction_proof);
  }
  // Update Room Yang Dipilih Menjadi Available
  // eslint-disable-next-line no-restricted-syntax, camelcase
  for (const room_id of booking.room_id) {
    // eslint-disable-next-line no-await-in-loop
    const room = await roomService.getRoomById(room_id);
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
    }
    // eslint-disable-next-line no-await-in-loop, no-unused-expressions
    room.is_booked = room.bookings > 1;
    room.is_clean = true;
    // eslint-disable-next-line no-restricted-syntax
    room.bookings = room.bookings.filter((b) => b.booking_id.toString() !== req.params.bookingId);
    // eslint-disable-next-line no-await-in-loop
    await room.save();
  }
  await bookingService.deleteBookingById(req.params.bookingId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getBookingsByVisitorId = catchAsync(async (req, res) => {
  let filter = pick(req.query, ['checkin_date', 'visitor_id', 'hotel_id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (filter.checkin_date) {
    // You may want to validate the date format or handle any parsing issues here
    // For simplicity, assuming the date format is valid ISO 8601
    const fullDate = new Date(filter.checkin_date);

    // Check the length of the provided date string
    if (filter.checkin_date.length === 4) {
      // If only the year is provided, set the filter to cover the entire year
      const startOfYear = new Date(fullDate.getFullYear(), 0, 1);
      const endOfYear = new Date(fullDate.getFullYear() + 1, 0, 1);

      // Set the time to 14:00:00
      startOfYear.setHours(14, 0, 0, 0);
      endOfYear.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfYear,
        $lt: endOfYear,
      };
    } else if (filter.checkin_date.length === 7) {
      // If year and month are provided, set the filter to cover the entire month
      const startOfMonth = new Date(fullDate.getFullYear(), fullDate.getMonth(), 1);
      const endOfMonth = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 1);

      // Set the time to 14:00:00
      startOfMonth.setHours(14, 0, 0, 0);
      endOfMonth.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfMonth,
        $lt: endOfMonth,
      };
    } else {
      // If the full date is provided, set the time to 14:00:00
      filter.checkin_date = setCheckinTime(fullDate);
    }
  }
  // Cek Visitor ID
  const visitor = await visitorService.getVisitorById(req.params.visitorId);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(visitor.hotel_id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  filter = { ...filter, visitor_id: req.params.visitorId };
  const result = await bookingService.queryBookings(filter, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No booking found');
  }
  res.send(result);
});

const updateBookingByVisitorId = catchAsync(async (req, res) => {
  const result = await roomService.updateRoomByHotelId(req.params.visitorId, req.body);
  res.send(result);
});

const deleteBookingByVisitorId = catchAsync(async (req, res) => {
  const visitor = await visitorService.getVisitorById(req.params.visitorId);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (!req.user.hotel_id.includes(visitor.hotel_id.toString())) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  const booking = await bookingService.getBookingsByVisitorId(req.params.visitorId);
  if (booking.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  // Update Room Yang Dipilih Menjadi Available
  // eslint-disable-next-line no-restricted-syntax
  for (const b of booking) {
    // eslint-disable-next-line no-restricted-syntax
    for (const r of b.room_id) {
      // eslint-disable-next-line no-await-in-loop
      await roomService.updateRoomById(r, {
        is_clean: true,
      });
    }
  }
  await bookingService.deleteBookingsByVisitorId(req.params.visitorId, req.body.hotel_id);
  res.status(httpStatus.NO_CONTENT).send();
});

const getBookingsByRoomId = catchAsync(async (req, res) => {
  let filter = pick(req.query, ['checkin_date', 'visitor_id', 'hotel_id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (filter.checkin_date) {
    // You may want to validate the date format or handle any parsing issues here
    // For simplicity, assuming the date format is valid ISO 8601
    const fullDate = new Date(filter.checkin_date);

    // Check the length of the provided date string
    if (filter.checkin_date.length === 4) {
      // If only the year is provided, set the filter to cover the entire year
      const startOfYear = new Date(fullDate.getFullYear(), 0, 1);
      const endOfYear = new Date(fullDate.getFullYear() + 1, 0, 1);

      // Set the time to 14:00:00
      startOfYear.setHours(14, 0, 0, 0);
      endOfYear.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfYear,
        $lt: endOfYear,
      };
    } else if (filter.checkin_date.length === 7) {
      // If year and month are provided, set the filter to cover the entire month
      const startOfMonth = new Date(fullDate.getFullYear(), fullDate.getMonth(), 1);
      const endOfMonth = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 1);

      // Set the time to 14:00:00
      startOfMonth.setHours(14, 0, 0, 0);
      endOfMonth.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfMonth,
        $lt: endOfMonth,
      };
    } else {
      // If the full date is provided, set the time to 14:00:00
      filter.checkin_date = setCheckinTime(fullDate);
    }
  }
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
  filter = {
    ...filter,
    room_id: { $in: room._id },
  };
  const result = await bookingService.queryBookings(filter, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No booking found');
  }
  res.send(result);
});

const getBookingsByHotelId = catchAsync(async (req, res) => {
  let filter = pick(req.query, ['checkin_date', 'visitor_id', 'hotel_id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (filter.checkin_date) {
    // You may want to validate the date format or handle any parsing issues here
    // For simplicity, assuming the date format is valid ISO 8601
    const fullDate = new Date(filter.checkin_date);

    // Check the length of the provided date string
    if (filter.checkin_date.length === 4) {
      // If only the year is provided, set the filter to cover the entire year
      const startOfYear = new Date(fullDate.getFullYear(), 0, 1);
      const endOfYear = new Date(fullDate.getFullYear() + 1, 0, 1);

      // Set the time to 14:00:00
      startOfYear.setHours(14, 0, 0, 0);
      endOfYear.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfYear,
        $lt: endOfYear,
      };
    } else if (filter.checkin_date.length === 7) {
      // If year and month are provided, set the filter to cover the entire month
      const startOfMonth = new Date(fullDate.getFullYear(), fullDate.getMonth(), 1);
      const endOfMonth = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 1);

      // Set the time to 14:00:00
      startOfMonth.setHours(14, 0, 0, 0);
      endOfMonth.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfMonth,
        $lt: endOfMonth,
      };
    } else {
      // If the full date is provided, set the time to 14:00:00
      filter.checkin_date = setCheckinTime(fullDate);
    }
  }
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
  filter = { ...filter, hotel_id: req.params.hotelId };
  const result = await bookingService.queryBookings(filter, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No booking found');
  }
  res.send(result);
});

const applyDiscount = catchAsync(async (req, res) => {
  const booking = await bookingService.applyDiscount(req.params.bookingId, req.body);
  res.send(booking);
});

module.exports = {
  createBooking,
  payBooking,
  getBookings,
  getBookingById,
  updateBookingById,
  deleteBookingById,
  getBookingsByVisitorId,
  updateBookingByVisitorId,
  deleteBookingByVisitorId,
  getBookingsByRoomId,
  getBookingsByHotelId,
  applyDiscount,
};
