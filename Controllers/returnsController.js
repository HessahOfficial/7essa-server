const Returns = require("../Models/returnsModel");
const Investment = require("../Models/investmentModel");
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');
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

//  const calculateTotalReturns = async (investmentId) => {
//       const totalReturns = await Returns.aggregate([
//         {
//           $match: { investmentId: new mongoose.Types.ObjectId(investmentId) }
//         },
//         {
//           $group: {
//             _id: null,
//             totalAmount: { $sum: "$returnAmount" }
//           }
//         }
//       ]);
    
//       return totalReturns.length > 0 ? totalReturns[0].totalAmount : 0;
//     };