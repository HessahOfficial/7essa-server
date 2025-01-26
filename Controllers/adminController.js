const factory = require('./handlerFactory');
const Property = require('../Models/propertyModel');

//For properties
exports.getAllProperties = factory.getAll(Property);

exports.getPropertyById = factory.getOne(Property);

exports.createProperty = factory.createOne(Property);

exports.updateProperty = factory.UpdateOne(Property);

exports.deleteProperty = factory.deleteOne(Property);
