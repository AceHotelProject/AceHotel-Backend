const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const gcs = require('../utils/cloudStorage');
const { noteService } = require('../services');

const createNote = catchAsync(async (req, res) => {
  const { file } = req;
  req.body.path_identity_image = await gcs.upload(file);
  const note = await noteService.createNote(req.body);
  res.status(httpStatus.CREATED).send(note);
});

const getNotes = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await noteService.queryNotes(filter, options);
  res.send(result);
});

const getNote = catchAsync(async (req, res) => {
  const note = await noteService.getNoteById(req.params.noteId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  res.send(note);
});

const updateNote = catchAsync(async (req, res) => {
  const note = await noteService.updateNoteById(req.params.noteId, req.body);
  res.send(note);
});

const deleteNote = catchAsync(async (req, res) => {
  await noteService.deleteNoteById(req.params.noteId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
};
