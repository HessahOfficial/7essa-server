const Investment = require('../Models/investmentModel');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require("util");
const jwt = require("jsonwebtoken");


exports.makeInvestment = catchAsync(async (req, res) => {
    //process.env.JWT_SECRET_ACCESS
const token = req.headers.authorization.split(" ")[1];
const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_ACCESS);
const userId = decoded.id || decoded.userId; 
console.log(decoded);
console.log("User ID:", userId);

    // const investment = await Investment.create({
    //     user: req.user.id,
    //     property: req.params.id,
    //     amount: req.body.amount
    // });
    // res.status(201).json({
    //     investment
    // });
    res.status(201).json({
        message: "Investment made successfully"
    })
})