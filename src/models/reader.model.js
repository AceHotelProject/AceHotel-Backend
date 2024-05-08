/* eslint-disable camelcase */
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const readerSchema = mongoose.Schema(
  {
    reader_name: {
      type: String,
      required: true,
      trim: true,
    },
    tag_expired: {
      type: Number,
      default: 20000,
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

/**
 * Check if reader is taken
 * @reader {string} reader_name - The reader's name
 * @reader {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
readerSchema.statics.isNameTaken = async function (reader_name, excludeReaderId) {
  const reader = await this.findOne({ reader_name, _id: { $ne: excludeReaderId } });

  return !!reader;
};

/**
 * @typedef Reader
 */
const Reader = mongoose.model('Reader', readerSchema);

module.exports = Reader;
