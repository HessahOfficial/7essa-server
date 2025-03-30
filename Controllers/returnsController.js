const Returns = require("../Models/returnsModel");
const Investment = require("../Models/investmentModel");
const catchAsync = require('../utils/catchAsync');

exports.addReturnPayment = catchAsync(async (req, res) => {
  const { userId, investmentId, paymentId, returnAmount } = req.body;

  // Create the return transaction
  const newReturn = await Returns.create({
    userId,
    investmentId,
    paymentId,
    returnAmount,
  });

  // Recalculate totalReturns for this investment
  const updatedTotalReturns = await calculateTotalReturns(investmentId);

  // Update the investment model
  await Investment.findByIdAndUpdate(investmentId, { totalReturns: updatedTotalReturns });

  res.status(201).json({
    message: "Return payment recorded successfully",
    newReturn,
    totalReturns: updatedTotalReturns,
  });
});
