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

tagSchema.pre('remove', async function (next) {
  // eslint-disable-next-line global-require
  const { Inventory } = require('.');
  // 1 Tag - 1 Inventory
  // 1 Inventory - Many Tag
  // Ketika Tag dihapus, maka inventory yang tag_id nya include dipop
  const tagId = this._id;
  await Inventory.updateMany({ tag_id: { $in: tagId } }, { $pull: { tag_id: tagId } });
  next();
});

/**
 * @typedef Tag
 */
const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
