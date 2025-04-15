const Property = require('../Models/propertyModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllProperties = catchAsync(async (req, res) => {
    const properties = await Property.find({});
    res.status(200).json({
        status: 'success',
        results: properties.length,
        data: { properties },
    });
})

exports.getPropertyById = catchAsync(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
        return res.status(404).json({
            status: 'fail',
            message: 'Property not found',
        });
    }
    res.status(200).json({
        status: 'success',
        data: { property },
    });
})
