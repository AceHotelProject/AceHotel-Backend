const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const hotelSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    owner_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: 'User',
    },
    regular_room_count: {
      type: Number,
      required: true,
    },
    regular_room_image_path: {
      type: String,
      required: true,
    },
    exclusive_room_count: {
      type: Number,
      required: true,
    },
    exclusive_room_image_path: {
      type: String,
      required: true,
    },
    room_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Room',
      },
    ],
    inventory_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Inventory',
      },
    ],
    revenue: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
hotelSchema.plugin(toJSON);
hotelSchema.plugin(paginate);

/**
 * @typedef Hotel
 */
const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
