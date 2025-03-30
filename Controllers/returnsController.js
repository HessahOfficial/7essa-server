const Returns = require("../Models/returnsModel");
const Investment = require("../Models/investmentModel");
const catchAsync = require('../utils/catchAsync');

exports.addReturnPayment = catchAsync(async (req, res) => {
  const { userId, investmentId, paymentId, returnAmount } = req.body;

  
  const newReturn = await Returns.create({
    userId,
    investmentId,
    paymentId,
    returnAmount,
  });

 
  const updatedTotalReturns = await calculateTotalReturns(investmentId);
  await Investment.findByIdAndUpdate(investmentId, { totalReturns: updatedTotalReturns });

  res.status(201).json({
    message: "Return payment recorded successfully",
    newReturn,
    totalReturns: updatedTotalReturns,
  });
});
