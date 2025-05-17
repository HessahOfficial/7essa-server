const Returns = require("../Models/returnsModel");
const Investment = require("../Models/investmentModel");
const asyncWrapper = require('../Middlewares/asyncWrapper');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');
const common = require('../utils/commonMethods');

exports.addReturnPayment = asyncWrapper(async (req, res, next) => {
  const { userId, investmentId, returnAmount } = req.body;
  const paymentId = req.params.id;

  if (!userId || !investmentId || !returnAmount) {
    const error = appError.create('Missing required fields', 400, httpStatusText.FAIL);
    return next(error);
  }

  const newReturn = await Returns.create({
    userId,
    investmentId,
    paymentId,
    returnAmount,
  });

  const updatedTotalReturns = await common.calculateTotalReturns(investmentId);
  await Investment.findByIdAndUpdate(investmentId, { totalReturns: updatedTotalReturns });

  res.status(201).json({
    message: "Return payment recorded successfully",
    newReturn,
    totalReturns: updatedTotalReturns,
  });
});
