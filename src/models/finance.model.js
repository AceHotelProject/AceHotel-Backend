const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { types } = require('../config/finance.types');
const financeUpdateRecordSchema = mongoose.Schema({
  revenue: {
    // total revenue in a day
    type: Number,
    required: true,
  },
  booking: {
    //total booking in a day
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, // Automatically set to current date
  },
});
const financeSchema = mongoose.Schema(
  {
    totalRevenue: {
      type: Number,
      required: true,
    },
    totalBooking: {
      type: Number,
      required: true,
    },
    finance_update_history: {
      type: [financeUpdateRecordSchema], // Array of update records
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
financeSchema.plugin(toJSON);
financeSchema.plugin(paginate);

/**
 * @typedef Finance
 */
const Finance = mongoose.model('Finance', financeSchema);

module.exports = Finance;
