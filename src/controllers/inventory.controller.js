const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { inventoryService, hotelService } = require('../services');

const createInventory = catchAsync(async (req, res) => {
  const inventory = await inventoryService.createInventory(req.body, req.user);
  hotelService.addInventoryId(req.query.hotel_id, inventory._id);
  res.status(httpStatus.CREATED).send(inventory);
});

const getInventories = catchAsync(async (req, res) => {
  const hotel = await hotelService.getHotelById(req.query.hotel_id);
  const inventory_id = hotel.inventory_id;
  const filter = pick(req.query, ['name', 'type']);
  const combinedFilter = {
    ...filter,
    _id: { $in: inventory_id },
  };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await inventoryService.queryInventories(combinedFilter, options);
  res.send(result);
});

const getInventory = catchAsync(async (req, res) => {
  const inventory = await inventoryService.getInventoryById(req.params.inventoryId);
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inventory not found');
  }
  res.send(inventory);
});

const updateInventory = catchAsync(async (req, res) => {
  const inventory = await inventoryService.updateInventoryById(req.params.inventoryId, req.body, req.user);
  res.send(inventory);
});

const deleteInventory = catchAsync(async (req, res) => {
  await hotelService.removeInventoryId(req.query.hotel_id, req.query.inventory_id);

  await inventoryService.deleteInventoryById(req.query.inventory_id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createInventory,
  getInventories,
  getInventory,
  updateInventory,
  deleteInventory,
};
