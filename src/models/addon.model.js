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

// 1 AddOn - Many Room

// 1 AddOn - 1 Inventory

// 1 AddOn - 1 Booking
// 1 Booking - Many AddOn
// Ketika AddOn dihapus, maka booking yang addon_id nya include dipop
addonSchema.pre('remove', async function (next) {
  // eslint-disable-next-line global-require
  const { Booking } = require('.');

  const addonId = this._id;
  await Booking.updateMany({ add_on_id: { $in: addonId } }, { $pull: { add_on_id: addonId } });
  next();
});

addonSchema.pre('deleteMany', async function (next) {
  // eslint-disable-next-line global-require
  const { Booking } = require('.');

  const addonId = this._id;
  await Booking.updateMany({ add_on_id: { $in: addonId } }, { $pull: { add_on_id: addonId } });
  next();
});

/**
 * @typedef Addon
 */
const Addon = mongoose.model('Addon', addonSchema);

module.exports = Addon;
