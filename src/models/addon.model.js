const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { types } = require('../config/inventory.types');

const addonSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: types,
      required: true,
    },
    price: {
      type: Number,
    },
    booking_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Bookings',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
addonSchema.plugin(toJSON);
addonSchema.plugin(paginate);

/**
 * @typedef Addon
 */
const Addon = mongoose.model('Addon', addonSchema);

module.exports = Addon;
