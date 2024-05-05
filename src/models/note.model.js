const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const noteSchema = mongoose.Schema(
  {
    detail: {
      type: String,
      required: true,
    },
    booking_id: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Booking',
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

noteSchema.pre('remove', async function (next) {
  // eslint-disable-next-line global-require
  const Booking = require('./booking.model');

  // 1 Note - Many Booking
  // 1 Booking - Many Note (On Room)
  // Ketika Note dihapus, Booking yang room.note_id nya sama dengan noteId diubah ke null
  const noteId = this._id;
  await Booking.updateMany(
    { 'room.note_id': noteId },
    { $set: { 'room.$[roomItem].note_id': null } },
    { arrayFilters: [{ 'roomItem.note_id': noteId }] }
  );
  next();
});

noteSchema.pre('deleteMany', async function (next) {
  // eslint-disable-next-line global-require
  const Booking = require('./booking.model');
  const noteId = this._id;
  await Booking.updateMany(
    { 'room.note_id': noteId },
    { $set: { 'room.$[roomItem].note_id': null } },
    { arrayFilters: [{ 'roomItem.note_id': noteId }] }
  );
  next();
});

/**
 * @typedef Note
 */
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
