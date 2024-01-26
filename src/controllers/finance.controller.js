const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { financeService } = require('../services');

const createFinance = catchAsync(async (req, res) => {
  const finance = await financeService.createFinance(req.body);
  res.status(httpStatus.CREATED).send(finance);
});

const getFinanceData = catchAsync(async (req, res) => {
  const options = pick(req.query, ['filter']);
  const result = await financeService.queryFinances(options);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Finance data not found');
  }
  res.send(result);
});

// const getFinance = catchAsync(async (req, res) => {
//   const finance = await financeService.getFinanceById(req.params.financeId);
//   if (!finance) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Finance not found');
//   }
//   res.send(finance);
// });

// const updateFinance = catchAsync(async (req, res) => {
//   const finance = await financeService.updateFinanceById(req.params.financeId, req.body);
//   res.send(finance);
// });

// const deleteFinance = catchAsync(async (req, res) => {
//   await financeService.deleteFinanceById(req.params.financeId);
//   res.status(httpStatus.NO_CONTENT).send();
// });

module.exports = {
  createFinance,
  getFinanceData,
  // getFinance,
  // updateFinance,
  // deleteFinance,
};
