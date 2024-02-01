const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const visitorRoute = require('./visitor.route');
const hotelRoute = require('./hotel.route');
const roomRoute = require('./room.route');
const webhookRoute = require('./webhook.route');
const inventoryRoute = require('./inventory.route');
const noteRoute = require('./note.route');
const bookingRoute = require('./booking.route');
const tagRoute = require('./tag.route');
const financeRoute = require('./finance.route');
const readerRoute = require('./reader.route');
const uploadRoute = require('./upload.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/visitors',
    route: visitorRoute,
  },
  {
    path: '/hotels',
    route: hotelRoute,
  },
  {
    path: '/rooms',
    route: roomRoute,
  },
  {
    path: '/inventory',
    route: inventoryRoute,
  },
  {
    path: '/note',
    route: noteRoute,
  },
  {
    path: '/tag',
    route: tagRoute,
  },
  {
    path: '/finance',
    route: financeRoute,
  },
  {
    path: '/webhook',
    route: webhookRoute,
  },
  {
    path: '/bookings',
    route: bookingRoute,
  },
  {
    path: '/reader',
    route: readerRoute,
  },
  {
    path: '/uploads',
    route: uploadRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
