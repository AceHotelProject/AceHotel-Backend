const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createReader = {
  body: Joi.object().keys({
    reader_name: Joi.string().required(),
  }),
};
const setQuery = {
  query: Joi.object().keys({
    state: Joi.bool().required(),
  }),
  params: Joi.object().keys({
    readerName: Joi.string().required(),
  }),
};
const getReaders = {
  query: Joi.object().keys({
    reader_name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getReader = {
  params: Joi.object().keys({
    reader_name: Joi.string().required(),
  }),
};

const updateReader = {
  params: Joi.object().keys({
    reader_name: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      power_gain: Joi.number(),
      read_interval: Joi.number(),
    })
    .min(1),
};

const deleteReader = {
  params: Joi.object().keys({
    reader_name: Joi.string().required(),
  }),
};

module.exports = {
  setQuery,
  createReader,
  getReaders,
  getReader,
  updateReader,
  deleteReader,
};
