const Joi = require('joi');
const { password, objectId } = require('./custom.validation');
const { types } = require('../config/inventory.types');

const createInventory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    type: Joi.string()
      .required()
      .valid(...types),
    stock: Joi.number().integer().required(),
  }),
};

const getInventories = {
  query: Joi.object().keys({
    name: Joi.string(),
    type: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getInventory = {
  params: Joi.object().keys({
    inventoryId: Joi.string().custom(objectId),
  }),
};

const updateInventory = {
  params: Joi.object().keys({
    inventoryId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    type: Joi.string().valid(...types),
    stock: Joi.number().integer().required(),
    title: Joi.string().required().required(),
    description: Joi.string().required(),
  }),
};

const deleteInventory = {
  params: Joi.object().keys({
    inventoryId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createInventory,
  getInventories,
  getInventory,
  updateInventory,
  deleteInventory,
};
