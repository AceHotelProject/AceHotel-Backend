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
    bookings: [
      {
        booking_id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'Booking',
        },
        visitor_id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: 'Visitor',
        },
        checkin_date: {
          type: Date,
        },
        checkout_date: {
          type: Date,
        },
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    facility: {
      bantal_putih: {
        type: Boolean,
        default: false,
      },
      bantal_hitam: {
        type: Boolean,
        default: false,
      },
      tv: {
        type: Boolean,
        default: false,
      },
      remote_tv: {
        type: Boolean,
        default: false,
      },
      remote_ac: {
        type: Boolean,
        default: false,
      },
      gantungan_baju: {
        type: Boolean,
        default: false,
      },
      karpet: {
        type: Boolean,
        default: false,
      },
      cermin_wastafel: {
        type: Boolean,
        default: false,
      },
      shower: {
        type: Boolean,
        default: false,
      },
      selendang: {
        type: Boolean,
        default: false,
      },
      kerangjang_sampah: {
        type: Boolean,
        default: false,
      },
      kursi: {
        type: Boolean,
        default: false,
      },
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
