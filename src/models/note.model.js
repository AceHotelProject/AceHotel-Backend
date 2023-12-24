const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');

const noteSchema = mongoose.Schema(
  {
    detail: {
      type: String,
      required: true,
    },
    room_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Room',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
noteSchema.plugin(toJSON);
noteSchema.plugin(paginate);

/**
 * @typedef Note
 */
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
