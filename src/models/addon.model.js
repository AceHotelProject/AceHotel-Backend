const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const addonSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
    },

    room_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Room',
      },
    ],
    inventory_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Inventory',
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
