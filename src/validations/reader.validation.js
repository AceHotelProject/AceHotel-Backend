const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createReader = {
  body: Joi.object().keys({
    reader_name: Joi.string().required(),
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
    reader_name: Joi.string().custom(objectId),
  }),
};

const updateReader = {
  params: Joi.object().keys({
    reader_name: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      reader_name: Joi.string(),
      power_gain: Joi.number(),
      read_interval: Joi.number(),
    })
    .min(1),
};

const deleteReader = {
  params: Joi.object().keys({
    readerId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createReader,
  getReaders,
  getReader,
  updateReader,
  deleteReader,
};
