/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { types } = require('../config/inventory.types');

const inventoryUpdateRecordSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now, // Automatically set to current date
  },
  personInCharge: {
    // Name of user in charge of update
    type: String,
    required: true,
    trim: true,
  },
  stockChange: {
    // jumlah perubahan
    type: Number,
    required: true,
  },
});
const inventorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: types,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    inventory_update_history: {
      type: [inventoryUpdateRecordSchema], // Array of update records
    },
    tag_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Tag',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
inventorySchema.plugin(toJSON);
inventorySchema.plugin(paginate);

// inventorySchema.statics.searchHistory = async function (keywords) {
//   const inventoryHistory =
//   return !!inventoryHistory;
// };

// 1 Inventory - Many Tag
// 1 Tag - 1 Inventory
// Ketika Inventory di hapus, maka tag yang inventory_id nya sesuai di hapus

inventorySchema.pre('remove', async function (next) {
  const { Tag } = require('.');
  const { Addon } = require('.');
  const inventoryId = this._id;
  const tag = await Tag.find({ inventory_id: inventoryId });
  for (const t of tag) {
    await t.remove();
  }
  const addon = await Addon.find({ inventory_id: inventoryId });
  for (const a of addon) {
    await a.remove();
  }
  next();
});
/**
 * @typedef Inventory
 */
const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
