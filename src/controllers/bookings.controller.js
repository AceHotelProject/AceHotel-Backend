const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { bookingService, roomService, hotelService, visitorService } = require('../services');
const gcs = require('../utils/cloudStorage');

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
  console.log(req.body);
  // Pilih Room Yang Tersedia (Berdasarkan Tipe Kamar dan Tanggal Checkin dan Checkout)
  req.body.room_id = await roomService.getAvailableRoomsByType(
    req.body.type,
    req.body.hotel_id,
    req.body.room_count,
    req.body.checkin_date
  );
  if (req.body.room_id.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No available room');
  }
  // Update Room Yang Dipilih Menjadi Booked
  for (const room_id of req.body.room_id) {
    await roomService.updateRoomById(room_id, {
      is_booked: true,
      booked_by: req.body.visitor_id,
      checkout: req.body.checkout_date,
    });
  }
  // Ambil Harga Room
  const room = await roomService.getRoomById(req.body.room_id[0]);
  // Jika Ada Add On, Buat Add On
  // Hitung Total Harga
  req.body.total_price = req.body.room_count * room.price * req.body.duration;
  console.log(room.price);
  // Buat Booking
  const booking = await bookingService.createBooking(req.body);
  res.status(httpStatus.CREATED).send(booking);
});

const payBooking = catchAsync(async (req, res) => {
  // Cek Booking ID
  const booking = await bookingService.getBookingById(req.params.bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  // Upload Bukti Pembayaran
  const { file } = req;
  booking.path_transaction_proof = await gcs.upload(file);
  // Update is_proof_uploaded
  booking.is_proof_uploaded = true;
  // Save
  await booking.save();
  res.status(httpStatus.OK).send(booking);
});

const getBookings = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['checkin_date', 'visitor_id', 'hotel_id']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
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
  // Update Room Yang Dipilih Menjadi Available
  for (const room_id of booking.room_id) {
    await roomService.updateRoomById(room_id, {
      is_booked: false,
      booked_by: null,
      checkout: undefined,
    });
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
  for (const b of booking) {
    for (const r of b.room_id) {
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
};
