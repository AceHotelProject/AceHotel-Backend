const mongoose = require('mongoose');

const { toJSON, paginate } = require('./plugins');

const tagSchema = mongoose.Schema(
  {
    tid: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['IN', 'OUT'],
      default: 'IN',
    },
    inventory_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Inventory',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tagSchema.plugin(toJSON);
tagSchema.plugin(paginate);

/**
 * @typedef Tag
 */
const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
