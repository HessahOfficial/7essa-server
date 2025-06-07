const validator = require('validator');
const Property = require('../Models/propertyModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');

const User = require('../Models/userModel');

exports.getAllProperties = asyncWrapper(
  async (req, res, next) => {
    const query = req.query;
    const limit = parseInt(query.limit) || 12;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;
    const ownerId = query.ownerId || '';
    const ownerName = query.ownerName || '';

    const sort = query.sort || '-createdAt'; 
    // Default sort by createdAt in descending order expected format: 'createdAt', '-createdAt', 'price', '-price', etc.
    const title = query.title || '';
    const city = query.city || '';
    const size = query.size || '';
    const area = query.area || '';
    const status = query.status || '';
    const numOfKitchens = query.numOfKitchens || '';
    const numOfBathrooms = query.numOfBathrooms || '';
    const numOfBeds = query.numOfBeds || '';
    const numOfRooms = query.numOfRooms || '';
    const isRented = query.isRented || '';

    const price = query.price || '';
    const availableShares = query.availableShares || '';
    const pricePerShare = query.pricePerShare || '';

    const estimatedExitDate = query.estimatedExitDate || '';
    const rentalIncome = query.rentalIncome || '';

    const maxSize = query.maxSize || '';
    const minSize = query.minSize || '';
    const minPrice = query.minPrice || '';
    const maxPrice = query.maxPrice || '';
    const minNumOfRooms = query.minNumOfRooms || '';
    const maxNumOfRooms = query.maxNumOfRooms || '';
    const minYearlyPayment = query.minYearlyPayment || '';
    const maxYearlyPayment = query.maxYearlyPayment || '';
    const minArea = query.minArea || '';
    const maxArea = query.maxArea || '';
    const minAvailableShares = query.minAvailableShares || '';
    const maxAvailableShares = query.maxAvailableShares || '';
    const minPricePerShare = query.minPricePerShare || '';
    const maxPricePerShare = query.maxPricePerShare || '';
    const minRentalIncome = query.minRentalIncome || '';
    const maxRentalIncome = query.maxRentalIncome || '';
    const minEstimatedExitDate = query.minEstimatedExitDate || '';
    const maxEstimatedExitDate = query.maxEstimatedExitDate || '';

    if (ownerId) {
      if (!validator.isMongoId(ownerId)) {
        const error = appError.create(
          'ownerId is not valid',
          400,
          httpStatusText.FAIL,
        );
        return next(error);
      }

      const owner = await User.findById(ownerId);
      if (!owner) {
        const error = appError.create(
          'Owner not found',
          404,
          httpStatusText.FAIL,
        );
        return next(error);
      }
    }

    // Build the query object
    let filter = {};
    if (ownerId) filter.owner = ownerId;
    if (ownerName) filter['owner.fullname'] = { $regex: ownerName, $options: 'i' };
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (size) filter.size = size;
    if (area) filter.area = area;
    if (status) filter.status = status;
    if (numOfKitchens) filter.numOfKitchens = numOfKitchens;
    if (numOfBathrooms) filter.numOfBathrooms = numOfBathrooms;
    if (numOfBeds) filter.numOfBeds = numOfBeds;
    if (numOfRooms) filter.numOfRooms = numOfRooms;
    if (isRented) filter.isRented = isRented;
    if (price) filter.price = price;
    if (availableShares) filter.availableShares = availableShares;
    if (pricePerShare) filter.pricePerShare = pricePerShare;
    if (estimatedExitDate) filter.estimatedExitDate = estimatedExitDate;
    if (rentalIncome) filter.rentalIncome = rentalIncome;
    if (maxSize) filter.size = { $lte: maxSize };
    if (minSize) filter.size = { $gte: minSize };
    if (minPrice) filter.price = { $gte: minPrice };
    if (maxPrice) filter.price = { $lte: maxPrice };
    if (minNumOfRooms) filter.numOfRooms = { $gte: minNumOfRooms };
    if (maxNumOfRooms) filter.numOfRooms = { $lte: maxNumOfRooms };
    if (minYearlyPayment) filter.yearlyPayment = { $gte: minYearlyPayment };
    if (maxYearlyPayment) filter.yearlyPayment = { $lte: maxYearlyPayment };
    if (minArea) filter.area = { $gte: minArea };
    if (maxArea) filter.area = { $lte: maxArea };
    if (minAvailableShares) filter.availableShares = { $gte: minAvailableShares };
    if (maxAvailableShares) filter.availableShares = { $lte: maxAvailableShares };
    if (minPricePerShare) filter.pricePerShare = { $gte: minPricePerShare };
    if (maxPricePerShare) filter.pricePerShare = { $lte: maxPricePerShare };
    if (minRentalIncome) filter.rentalIncome = { $gte: minRentalIncome };
    if (maxRentalIncome) filter.rentalIncome = { $lte: maxRentalIncome };
    if (minEstimatedExitDate) filter.estimatedExitDate = { $gte: minEstimatedExitDate };
    if (maxEstimatedExitDate) filter.estimatedExitDate = { $lte: maxEstimatedExitDate };
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { city: searchRegex },
        { 'owner.fullname': searchRegex },
      ];
    }
    
    // Fetch properties with pagination and sorting
    const properties = await Property.find(filter).sort(sort).skip(skip).limit(limit).populate('owner', 'fullName avatar phoneNumber');
    for (const property of properties) {
      await property.save(); // Ensure the property is saved with the latest data
    }

    const totalProperties = await Property.countDocuments(filter);
    const totalPages = Math.ceil(totalProperties / limit);

    res.status(200).json({
      status: 'success',
      results: properties.length,
      data: { 
        properties ,
        totalProperties,
        totalPages,
      },
    });
  },
);

exports.getPropertyById = asyncWrapper(
  async (req, res, next) => {
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
  },
);

