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
    room_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'Room',
      },
    ],
    visitor_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
      ref: 'Visitor',
    },
    checkin_date: {
      type: Date,
      required: true,
    },
    actual_checkin: {
      type: Date,
    },
    checkin_staff_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    duration: {
      type: Number,
      required: true,
    },
    checkout_date: {
      type: Date,
      required: true,
    },
    actual_checkout: {
      type: Date,
    },
    checkout_staff_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    total_price: {
      type: Number,
      required: true,
      default: 0,
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
