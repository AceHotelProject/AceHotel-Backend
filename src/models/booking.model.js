const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const bookingSchema = mongoose.Schema(
  {
    hotel_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: 'Hotel',
    },
    type: {
      type: String,
      enum: ['regular', 'exclusive'],
      required: true,
    },
    room_count: {
      type: Number,
      required: true,
    },
    room: [
      {
        id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'Room',
        },
        actual_checkin: {
          type: Date,
        },
        actual_checkout: {
          type: Date,
        },
        checkin_staff_id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'User',
        },
        checkout_staff_id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'User',
        },
        has_problem: {
          type: Boolean,
          default: false,
        },
        note_id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'Note',
        },
      },
    ],
    visitor_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: 'Visitor',
    },
    visitor_name: {
      type: String,
      required: true,
    },
    checkin_date: {
      type: Date,
      required: true,
    },
    add_on_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'AddOn',
      },
    ],
    duration: {
      type: Number,
      required: true,
    },
    checkout_date: {
      type: Date,
      required: true,
    },
    total_price: {
      type: Number,
      required: true,
      default: 0,
    },
    is_proof_uploaded: {
      type: Boolean,
      required: true,
      default: false,
    },
    path_transaction_proof: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
bookingSchema.plugin(toJSON);
bookingSchema.plugin(paginate);

/**
 * @typedef Booking
 */
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
