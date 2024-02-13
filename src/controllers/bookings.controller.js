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
  req.body.room_id = await roomService.getAvailableRoomsByType(
    req.body.type,
    req.body.hotel_id,
    req.body.room_count,
    req.body.checkin_date,
    req.body.checkout_date
  );
  if (req.body.room_id.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No available room');
  }
  // Buat Booking
  const booking = await bookingService.createBooking(req.body);
  // Update Room Yang Dipilih Menjadi Booked
  // eslint-disable-next-line camelcase, no-restricted-syntax
  for (const room_id of req.body.room_id) {
    // eslint-disable-next-line no-await-in-loop
    await roomService.bookingRoomById(room_id, {
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
  const room = await roomService.getRoomById(req.body.room_id[0]);
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
  }
  // Hitung Total Harga
  booking.total_price = req.body.room_count * room.price * req.body.duration + req.body.extra_bed * hotel.extra_bed_price;
  // Save
  await booking.save();
  res.status(httpStatus.CREATED).send(booking);
});

const payBooking = catchAsync(async (req, res) => {
  // Cek Booking ID
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  booking.path_transaction_proof = req.body.path_transaction_proof;
  // Update is_proof_uploaded
  booking.is_proof_uploaded = true;
  // Save
  await booking.save();
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
  res.send(booking);
});

const updateBookingById = catchAsync(async (req, res) => {
  const booking = await bookingService.updateBookingById(req.params.bookingId, req.body);
  res.send(booking);
});

const deleteBookingById = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
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
    // eslint-disable-next-line no-await-in-loop
    room.is_booked = false;
    room.is_clean = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const b of room.bookings) {
      if (b.visitor_id.toString() === booking.visitor_id.toString()) {
        room.bookings = room.bookings.filter((book) => book.visitor_id.toString() !== booking.visitor_id.toString());
        break;
      }
    }
  }
  await bookingService.deleteBookingById(req.params.bookingId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getBookingsByVisitorId = catchAsync(async (req, res) => {
  // Cek Visitor ID
  const visitor = await visitorService.getVisitorById(req.params.visitorId);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  // Cek Hotel ID
  const hotel = await hotelService.getHotelById(req.body.hotel_id);
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
  }
  const result = await bookingService.getBookingsByVisitorId(req.params.visitorId, req.body.hotel_id);
  if (result.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No booking found');
  }
  res.send(result);
});

const updateBookingByVisitorId = catchAsync(async (req, res) => {
  const result = await roomService.updateRoomByHotelId(req.params.visitorId, req.body);
  res.send(result);
});

const deleteBookingByVisitorId = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingsByVisitorId(req.params.visitorId, req.body.hotel_id);
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
        is_booked: false,
        booked_by: null,
        checkout: undefined,
      });
    }
  }
  await bookingService.deleteBookingsByVisitorId(req.params.visitorId, req.body.hotel_id);
  res.status(httpStatus.NO_CONTENT).send();
});

const getBookingsByRoomId = catchAsync(async (req, res) => {
  const result = await bookingService.getBookingsByRoomId(req.params.roomId);
  if (result.length === 0) {
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
  applyDiscount,
};
