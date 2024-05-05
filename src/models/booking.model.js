/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const Room = require('./room.model');
const Note = require('./note.model');
const Addon = require('./addon.model');

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

// 1 Booking - 1 Hotel

// 1 Booking - Many Room
// 1 Room - Many Booking
// Ketika Booking dihapus, maka Room yang booking_id nya include dipop

// 1 Booking - Many Note
// 1 Note - Many Booking
// Ketika Booking dihapus, maka Note yang booking_id nya include dipop

// 1 Booking - 1 Visitor

// 1 Booking - Many AddOn
// 1 AddOn - 1 Booking
// Ketika Booking dihapus, maka AddOn yang booking_id nya sesuai di hapus

bookingSchema.pre('remove', async function (next) {
  const booking = this;
  // Masih Salah Disini
  await Room.updateMany({ bookings: { $in: booking._id } }, { $pull: { bookings: booking._id } });
  const note = await Note.find({ booking_id: booking._id });
  for (const n of note) {
    await n.remove();
  }
  const addon = await Addon.find({ booking_id: booking._id });
  for (const a of addon) {
    await a.remove();
  }
  next();
});

bookingSchema.pre('deleteMany', async function (next) {
  const booking = this;
  await Room.updateMany({ bookings: { $in: booking._id } }, { $pull: { bookings: booking._id } });
  const note = await Note.find({ booking_id: booking._id });
  for (const n of note) {
    await n.remove();
  }
  const addon = await Addon.find({ booking_id: booking._id });
  for (const a of addon) {
    await a.remove();
  }
  next();
});

/**
 * @typedef Booking
 */
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
