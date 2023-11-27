const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const visitorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    identity_num: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!value.match(/(1[1-9]|21|[37][1-6]|5[1-3]|6[1-5]|[89][12])\d{2}\d{2}([04][1-9]|[1256][0-9]|[37][01])(0[1-9]|1[0-2])\d{2}\d{4}/)) {
          throw new Error('Format NIK Anda Salah');
        }
      },
    },
    path_identity_image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
visitorSchema.plugin(toJSON);
visitorSchema.plugin(paginate);

/**
 * @typedef User
 */
const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
