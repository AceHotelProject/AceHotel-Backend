const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const Hotel = require('./hotel.model');

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles,
      default: 'receptionist',
    },
    hotel_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Hotel',
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// 1 User - Many Hotel
// 1 Hotel - Many User
userSchema.pre('remove', async function (next) {
  const user = this;
  if (user.role === 'branch_manager') {
    await Hotel.updateMany({ owner_id: user._id }, { $set: { owner_id: null } });
  } else if (user.role === 'receptionist') {
    await Hotel.updateMany({ receptionist_id: user._id }, { $set: { receptionist_id: null } });
  } else if (user.role === 'cleaning_staff') {
    await Hotel.updateMany({ cleaning_staff_id: user._id }, { $set: { cleaning_staff_id: null } });
  } else if (user.role === 'inventory_staff') {
    await Hotel.updateMany({ inventory_staff_id: user._id }, { $set: { inventory_staff_id: null } });
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
