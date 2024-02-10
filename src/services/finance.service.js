const httpStatus = require('http-status');
const { Finance } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a finance
 * @param {Object} financeBody
 * @returns {Promise<Finance>}
 */
const createFinance = async (financeBody) => {
  return Finance.create(financeBody);
};

/**
 * Query for finances
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryFinances = async (options) => {
  const now = new Date();
  let startDate;
  let endDate;

  if (options.filter === 'thisDay') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (options.filter === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (options.filter === 'thisYear') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    throw new Error('Invalid filter option');
  }

  const financeData = await Finance.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).exec();

  return financeData;
};

// /**
//  * Get finance by id
//  * @param {ObjectId} id
//  * @returns {Promise<Finance>}
//  */
// const getFinanceById = async (id) => {
//   return Finance.findById(id);
// };

// /**
//  * Update finance by id
//  * @param {ObjectId} financeId
//  * @param {Object} updateBody
//  * @returns {Promise<Finance>}
//  */
// const updateFinanceById = async (financeId, updateBody) => {
//   const finance = await getFinanceById(financeId);
//   if (!finance) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Finance not found');
//   }
//   Object.assign(finance, updateBody);
//   await finance.save();
//   return finance;
// };

// /**
//  * Delete finance by id
//  * @param {ObjectId} financeId
//  * @returns {Promise<Finance>}
//  */
// const deleteFinanceById = async (financeId) => {
//   const finance = await getFinanceById(financeId);
//   if (!finance) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Finance not found');
//   }
//   await finance.remove();
//   return finance;
// };

module.exports = {
  createFinance,
  queryFinances,
  // getFinanceById,
  // updateFinanceById,
  // deleteFinanceById,
};
