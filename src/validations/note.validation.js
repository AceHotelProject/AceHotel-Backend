const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createNote = {
  body: Joi.object().keys({
    detail: Joi.string().required(),
    address: Joi.string().required(),
    identity_num: Joi.string().required(),
    path_identity_image: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().required().email(),
  }),
};

const getVisitors = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getVisitor = {
  params: Joi.object().keys({
    visitorId: Joi.string().custom(objectId),
  }),
};

const updateVisitor = {
  params: Joi.object().keys({
    visitorId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      address: Joi.string(),
      name: Joi.string(),
      phone: Joi.string(),
      identity_num: Joi.string(),
    })
    .min(1),
};

const deleteVisitor = {
  params: Joi.object().keys({
    visitorId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createVisitor,
  getVisitors,
  getVisitor,
  updateVisitor,
  deleteVisitor,
};
