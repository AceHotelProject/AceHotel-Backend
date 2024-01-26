const mongoose = require('mongoose');
const validator = require('validator');
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
      unique: true,
      required: true,
      trim: true,
      validate(value) {
        if (
          !value.match(
            /(1[1-9]|21|[37][1-6]|5[1-3]|6[1-5]|[89][12])\d{2}\d{2}([04][1-9]|[1256][0-9]|[37][01])(0[1-9]|1[0-2])\d{2}\d{4}/
          )
        ) {
          throw new Error('Format NIK Anda Salah');
        }
      },
    },
    path_identity_image: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      validate(value) {
        if (!value.match(/^08[0-9]{9,12}$/)) {
          throw new Error('Format Nomor Telepon Anda Salah');
        }
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Format Email Anda Salah');
        }
      },
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
visitorSchema.plugin(toJSON);
visitorSchema.plugin(paginate);

visitorSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

visitorSchema.statics.isNIKTaken = async function (identity_num, excludeUserId) {
  const user = await this.findOne({ identity_num, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * @typedef User
 */
const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
