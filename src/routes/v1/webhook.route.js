const express = require('express');
const webhookController = require('../../controllers/webhook.controller');
const router = express.Router();
router.route('/').get(webhookController.update);

module.exports = router;
