const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { bookingService, hotelService } = require('../services');

const getRecap = catchAsync(async (req, res) => {
  let revenue = 0;
  const branchCount = req.user.hotel_id.length;
  let checkinCount = 0;
  let totalBooking = 0;
  for (const h of req.user.hotel_id) {
    const hotel = await hotelService.getHotelById(h);
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
  res.status(httpStatus.OK).send({
    revenue,
    branch_count: branchCount,
    checkin_count: checkinCount,
    total_booking: totalBooking,
  });
});

module.exports = {
  getRecap,
};
