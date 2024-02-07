const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { bookingService } = require('../services');

const getRecap = catchAsync(async (req, res) => {
  const revenue = 0;
  const branchCount = req.user.hotel_id.length;
  const checkinCount = 0;
  const totalBooking = 0;
  for (const hotel of req.user.hotel_id) {
    const hotel = await hotelService.hotelService.getHotelById(hotel);
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
    }
    revenue += hotel.revenue;
    const bookings = await bookingService.getBookingsByHotelId(hotel._id);
    totalBooking += bookings.length;
    for (const booking of bookings) {
      if (booking.actual_checkin) {
        checkinCount += 1;
      }
    }
  }
  res.httpStatus(httpStatus.OK).send({
    revenue,
    branch_count: branchCount,
    checkin_count: checkinCount,
    total_booking: totalBooking,
  });
});

module.exports = {
  getRecap,
};
