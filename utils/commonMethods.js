const mongoose = require('mongoose');
const Returns = require("../Models/returnsModel");

exports. calculateTotalReturns = async (investmentId) => {
    const totalReturns = await Returns.aggregate([
      {
        $match: { investmentId: new mongoose.Types.ObjectId(investmentId) }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$returnAmount" }
        }
      }
    ]);
  
    return totalReturns.length > 0 ? totalReturns[0].totalAmount : 0;
  };