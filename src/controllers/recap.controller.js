const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { bookingService, hotelService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const setCheckinTime = (date) => {
  if (!(date instanceof Date)) {
    throw new Error('Invalid date provided');
  }

  // Set the time to 14:00:00
  date.setHours(14, 0, 0, 0);
  return date;
};

const getRecap = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['checkin_date']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.limit = 9999999999;
  if (filter.checkin_date) {
    // You may want to validate the date format or handle any parsing issues here
    // For simplicity, assuming the date format is valid ISO 8601
    const fullDate = new Date(filter.checkin_date);

    // Check the length of the provided date string
    if (filter.checkin_date.length === 4) {
      // If only the year is provided, set the filter to cover the entire year
      const startOfYear = new Date(fullDate.getFullYear(), 0, 1);
      const endOfYear = new Date(fullDate.getFullYear() + 1, 0, 1);

      // Set the checkin_date to 14:00:00
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

      // Set the checkin_date to 14:00:00
      startOfMonth.setHours(14, 0, 0, 0);
      endOfMonth.setHours(14, 0, 0, 0);

      filter.checkin_date = {
        $gte: startOfMonth,
        $lt: endOfMonth,
      };
    } else {
      // If the full date is provided, set the checkin_date to 14:00:00
      filter.checkin_date = setCheckinTime(fullDate);
    }
  }
  let revenue = 0;
  const branchCount = req.user.hotel_id.length;
  let checkinCount = 0;
  let totalBooking = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const h of req.user.hotel_id) {
    // eslint-disable-next-line no-await-in-loop
    const hotel = await hotelService.getHotelById(h.toString());
    if (!hotel) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Hotel not found');
    }
    // eslint-disable-next-line no-await-in-loop
    const bookings = await bookingService.queryBookings(filter, options);
    if (!bookings) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }
    totalBooking += bookings.totalResults;
    // eslint-disable-next-line no-restricted-syntax
    for (const booking of bookings.results) {
      revenue += booking.total_price;
      // eslint-disable-next-line no-restricted-syntax
      for (const r of booking.room) {
        if (!r.actual_checkin) {
          checkinCount += 1;
        }
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
