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
    path: '/webhook',
    route: webhookRoute,
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
