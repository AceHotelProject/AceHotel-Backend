const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const tagSchema = mongoose.Schema(
  {
    hex: {
      type: String,
      required: true,
    },
    inventory_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Inventory',
      },
    ],
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
