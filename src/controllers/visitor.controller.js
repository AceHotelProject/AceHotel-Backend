const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { visitorService } = require('../services');
const { deleteFile } = require('../utils/cloudStorage');

const createVisitor = catchAsync(async (req, res) => {
  const visitor = await visitorService.createVisitor(req.body);
  res.status(httpStatus.CREATED).send(visitor);
});

const getVisitors = catchAsync(async (req, res) => {
  let filter = pick(req.query, ['email', 'identity_num']); // Exclude 'name' from direct filtering
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    filter = {
      ...filter,
      hotel_id: req.query.hotel_id,
    };
  } else if (req.user.role === 'owner') {
    if (req.query.hotel_id) {
      filter = {
        ...filter,
        hotel_id: req.query.hotel_id,
      };
    }
  }
  // eslint-disable-next-line security/detect-non-literal-regexp
  const nameFilter = req.query.name ? { name: { $regex: new RegExp(req.query.name, 'i') } } : {};
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await visitorService.queryVisitors({ ...filter, ...nameFilter }, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No visitors found');
  }
  res.send(result);
});

const getVisitor = catchAsync(async (req, res) => {
  const visitor = await visitorService.getVisitorById(req.params.visitorId);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (visitor.hotel_id != req.query.hotel_id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  res.send(visitor);
});

const updateVisitor = catchAsync(async (req, res) => {
  const visitor = await visitorService.getVisitorById(req.params.visitorId);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (visitor.hotel_id != req.query.hotel_id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  const updatedVisitor = await visitorService.updateVisitorById(req.params.visitorId, req.body);
  res.send(updatedVisitor);
});

const deleteVisitor = catchAsync(async (req, res) => {
  const visitor = await visitorService.getVisitorById(req.params.visitorId);
  if (!visitor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Visitor not found');
  }
  if (
    req.user.role === 'branch_manager' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'cleaning_staff' ||
    req.user.role === 'inventory_staff'
  ) {
    if (visitor.hotel_id != req.query.hotel_id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  await deleteFile(visitor.path_identity_image);
  await visitorService.deleteVisitorById(req.params.visitorId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createVisitor,
  getVisitors,
  getVisitor,
  updateVisitor,
  deleteVisitor,
};
