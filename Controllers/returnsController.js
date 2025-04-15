const Returns = require("../Models/returnsModel");
const Investment = require("../Models/investmentModel");
const catchAsync = require('../utils/catchAsync');
const common = require('../utils/commonMethods');

exports.addReturnPayment = catchAsync(async (req, res) => {
  const { userId, investmentId, returnAmount } = req.body;
  const paymentId = req.params.id;

  
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
