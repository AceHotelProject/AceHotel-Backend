const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { addonService } = require('../services');

const createAddon = catchAsync(async (req, res) => {
  const addon = await addonService.createAddon(req.body);
  res.status(httpStatus.CREATED).send(addon);
});

const getAddons = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await addonService.queryAddons(filter, options);
  res.send(result);
});

const getAddon = catchAsync(async (req, res) => {
  const addon = await addonService.getAddonById(req.params.addonId);
  if (!addon) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Addon not found');
  }
  res.send(addon);
});

const updateAddon = catchAsync(async (req, res) => {
  const addon = await addonService.updateAddonById(req.params.addonId, req.body);
  res.send(addon);
});

const deleteAddon = catchAsync(async (req, res) => {
  await addonService.deleteAddonById(req.params.addonId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createAddon,
  getAddons,
  getAddon,
  updateAddon,
  deleteAddon,
};
