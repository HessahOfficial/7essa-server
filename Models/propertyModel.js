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
    default: ["https://cdn.pixabay.com/photo/2017/06/16/15/58/luxury-home-2409518_960_720.jpg"],
    validate: {
      validator: function (array) {
        return array.length <= 15;
      },
      message: 'The images array can have a maximum of 15 items.',
    },
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
    type: Number,
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
  displayingPrice: {
    type: String,
    default: '2000 LE/Share',
  },
  numOfBeds: {
    type: Number,
    default: 0,
  },
  numOfKitchens: {
    type: Number,
    default: 0,
  },
  numOfBathrooms: {
    type: Number,
    default: 0,
  },
  area: {
    type: Number,
    default: 0,
  },
  managementCompany: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  priceHistory: [{
    price: Number,
    date: { type: Date, default: Date.now }
  }],
  pricePerShareHistory: [{
    pricePerShare: Number,
    date: { type: Date, default: Date.now }
  }],
});

propertySchema.pre('save', function (next) {
  // Set displayingPrice
  if (this.pricePerShare) {
    this.displayingPrice = `${this.pricePerShare} LE/Share`;
  } else {
    this.displayingPrice = '2000 LE/Share';
  }

  if (this.isNew) {
    if (this.price) {
      this.priceHistory = [{ price: this.price }];
    }
    if (this.pricePerShare) {
      this.pricePerShareHistory = [{ pricePerShare: this.pricePerShare }];
    }
  }

  next();
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
