const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const financeSchema = mongoose.Schema(
  {
    revenue: {
      // total revenue in a day
      type: Number,
      required: true,
    },
    booking: {
      // total booking in a day
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now, // Automatically set to current date
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
