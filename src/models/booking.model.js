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
    },
    add_on_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'AddOn',
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
