const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const addonSchema = mongoose.Schema(
  {
    name: {
      type: String,
      enum: types,
      required: true,
    },
    price: {
      type: Number,
      required: true,
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
