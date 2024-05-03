const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const Room = require('./room.model');
const User = require('./user.model');
const Inventory = require('./inventory.model');
const Visitor = require('./visitor.model');

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
      ref: 'User',
    },
    receptionist_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    cleaning_staff_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    inventory_staff_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    regular_room_count: {
      type: Number,
      required: true,
    },
    regular_room_image_path: [
      {
        type: String,
        required: true,
      },
    ],
    regular_room_price: {
      type: Number,
      required: true,
    },
    exclusive_room_count: {
      type: Number,
      required: true,
    },
    exclusive_room_image_path: [
      {
        type: String,
        required: true,
      },
    ],
    exclusive_room_price: {
      type: Number,
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
    extra_bed_price: {
      type: Number,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    discount_code: {
      type: String,
    },
    discount_amount: {
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

// 1 Hotel - Many User
// 1 User - Many Hotel
// Ketika Hotel dihapus, maka user yang hotel_id nya include dipop

// 1 Hotel - Many Room
// 1 Room - 1 Hotel
// Ketika Hotel dihapus, maka room yang hotel_id nya sesuai di hapus

// 1 Hotel - Many Inventory
// 1 Inventory - 1 Hotel
// Ketika Hotel dihapus, maka inventory yang hotel_id nya sesuai di hapus
hotelSchema.pre('remove', async function (next) {
  const hotel = this;
  await Room.deleteMany({ hotel_id: hotel._id });
  const user = await User.find({ hotel_id: hotel._id });
  await User.updateMany({ _id: { $in: user }, role: 'owner' }, { $pull: { hotel_id: hotel._id } });
  await User.deleteMany({ _id: { $in: user }, role: { $ne: 'owner' } });
  // eslint-disable-next-line no-restricted-syntax
  for (const i of hotel.inventory_id) {
    // eslint-disable-next-line no-await-in-loop
    await Inventory.deleteOne({ _id: i });
  }
  await Visitor.deleteMany({ hotel_id: hotel._id });
  next();
});

/**
 * @typedef Hotel
 */
const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
