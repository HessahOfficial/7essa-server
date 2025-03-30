const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true,
    required: [true, 'Property must have a title'],
  },
  description: {
    type: String,
    required: [true, 'Property must have a description'],
  },
  city: {
    type: String,
    required: [true, 'Property must have a city'],
  },
  locationLink: { type: String }, //the location link not required
  size: {
    type: Number,
    required: [true, 'Property must have a size'],
  },
  numOfRooms: {
    type: Number,
    required: [true, 'number of rooms is required'],
  },
  images: {
    type: [String],
    required: [true, 'Property must have an image'],
  },
  totalShares: {
    type: Number,
    required: [true, 'total shares is required'],
  },
  availableShares: {
    type: Number,
    required: [true, 'available shares is required'],
  },
  yearlyPayment: {
    type: Number,
    required: [true, 'yearly Payment is required'],
  },
  price: {
    type: [Number],
    required: [true, 'Property must have a price'],
  },
  pricePerShare: {
    type: [Number],
    required: [true, 'price per share is required'],
  },
  estimatedExitDate: {
    type: Date,
    required: [true, 'estimated exit date is required'],
  },
  isRented: {
    type: Boolean,
    default: false,
  },
  rentalIncome: {
    type: Number,
  },
  rentalName: {
    type: String,
  },
  rentalStartDate: {
    type: Date,
  },
  rentalEndDate: {
    type: Date,
  },
  benefits: {
    type: [String],
    required: [true, 'benefits are required'],
  },
  priceSold: {
    type: Number,
    default: 0,
  },
  managementCompany: {
    type: String,
  },
  status: {
    type: String,
    required: [true, 'property status is required'],
    enum: ['Available', 'Funded', 'Exited'],
  },
  investmentDocs: {
    type: String,
    required: [
      true,
      'Property must have the investment documents',
    ],
  },
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
