const mongoose = require('mongoose');

const { toJSON, paginate } = require('./plugins');
const Inventory = require('./inventory.model');

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

tagSchema.pre('deleteOne', async function (next) {
  const tagId = this._id;
  await Inventory.updateMany({ tag_id: { $in: tagId } }, { $pull: { tag_id: tagId } });
  next();
});
/**
 * @typedef Tag
 */
const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
