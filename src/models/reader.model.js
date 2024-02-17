const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const readerSchema = mongoose.Schema(
  {
    reader_name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    power_gain: {
      type: Number,
      default: 30,
    },
    query_mode: {
      type: Boolean,
      default: true,
    },
    read_interval: {
      type: Number,
      default: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
readerSchema.plugin(toJSON);
readerSchema.plugin(paginate);

readerSchema.statics.isNameTaken = async function (reader_name, excludeReaderId) {
  const reader = await this.findOne({ reader_name, _id: { $ne: excludeReaderId } });
  return !!reader;
};

/**
 * @typedef Reader
 */
const Reader = mongoose.model('Reader', readerSchema);

module.exports = Reader;
