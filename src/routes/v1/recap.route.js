const express = require('express');
const auth = require('../../middlewares/auth');
const recapController = require('../../controllers/recap.controller');

const router = express.Router();

router.route('/').get(auth('recap'), recapController.getRecap);

module.exports = router;
