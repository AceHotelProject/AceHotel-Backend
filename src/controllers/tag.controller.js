const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { tagService, inventoryService } = require('../services');

const createTag = catchAsync(async (req, res) => {
  const tag = await tagService.createTag(req.body);
  inventoryService.addTagId(req.body.inventory_id, tag._id);
  res.status(httpStatus.CREATED).send(tag);
});
const getTagId = catchAsync(async (req, res) => {
  const tag = await tagService.getTagId(req);
  if (!tag) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to get tag id');
  }

  res.status(httpStatus.CREATED).send(tag);
});

const getTags = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await tagService.queryTags(filter, options);
  if (result.totalResults === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No tags found');
  }

  res.send(result);
});

const getTag = catchAsync(async (req, res) => {
  const tag = await tagService.getTagById(req.params.tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  res.send(tag);
});
const setQuery = catchAsync(async (req, res) => {
  const result = await tagService.setQuery(req);
  res.status(httpStatus.OK).send(result);
});
const updateTag = catchAsync(async (req, res) => {
  const tag = await tagService.updateTagById(req.params.tagId, req.body);
  res.send(tag);
});

const deleteTag = catchAsync(async (req, res) => {
  await tagService.deleteTagById(req.params.tagId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  setQuery,
  createTag,
  getTags,
  getTagId,
  getTag,
  updateTag,
  deleteTag,
};
/*

mosquitto_sub -d -q 1 -h 35.202.12.122 -p 1883 -t /mqtt-integration/inventory/SN-001/rx -i 'backend3' -u 'backend3' -P 'an1m3w1bu' -c -v
mosquitto_pub -d -q 1 -h 35.202.12.122 -p 1883 -t tbmq/demo/topic -i 'backend-client' -u 'backend-client' -P 'an1m3w1bu' -c -m 'Hello World'
*/
