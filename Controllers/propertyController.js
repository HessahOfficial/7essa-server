const Property = require('../Models/propertyModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');

exports.getAllProperties = asyncWrapper(async (req, res, next) => {
    const properties = await Property.find({});
    res.status(200).json({
        status: 'success',
        results: properties.length,
        data: { properties },
    });
});

exports.getPropertyById = asyncWrapper(async (req, res, next) => {
    const property = await Property.findById(req.params.id);
    if (!property) {
        const error = appError.create(
            'Property not found',
            404,
            httpStatusText.FAIL,
        );
        return next(error);
    }
    res.status(200).json({
        status: 'success',
        data: { property },
    });
});
