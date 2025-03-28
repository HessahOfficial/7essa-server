const Property = require('../Models/propertyModel');

const factory = require('./handlerFactory');



exports.getAllProperties = factory.getAll(Property);
exports.getPropertyById = factory.getOne(Property);
