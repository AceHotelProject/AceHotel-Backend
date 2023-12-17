const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const roomSchema = mongoose.Schema(
  {
    hotel_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: 'Hotel',
    },
    type: {
      type: String,
      enum: ['regular', 'exclusive'],
      default: 'regular',
      required: true,
    },
    is_booked: {
      type: Boolean,
      default: false,
    },
    is_clean: {
      type: Boolean,
      default: true,
    },
    booked_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Visitor',
    },
    checkout: {
      type: Date,
    },
    add_on_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'AddOn',
      },
    ],
    has_problem: {
      type: Boolean,
      default: false,
    },
    note_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Note',
      },
    ],
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
roomSchema.plugin(toJSON);
roomSchema.plugin(paginate);

/**
 * @typedef Room
 */
const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
