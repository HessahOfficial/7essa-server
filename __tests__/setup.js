const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Property = require('../Models/propertyModel');
const User = require('../Models/userModel');

jest.mock('../Config/passport', () => {
});

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany();
  }

  // 🧪 Seed basic data here 
  await User.create({
    fullName: "Admin",
    email: "admin@gmail.com",
    role: "ADMIN",
    password: "123456@Aa",
    emailVerified
  });
  // 🧪 Seed 10 Normal users
  for (let i = 0; i < 10; i++) {
    await User.create({
      fullName: `User ${i}`,
      email: `user${i}@gmail.com`,
      role: "USER",
      password: "123456@Aa",
      emailVerified: true
    });
  }
  // 🧪 Seed 5 Investor Users 
  for (let i = 0; i < 5; i++) {
    await User.create({
      fullName: `Investor ${i}`,
      email: `investor${i}@gmail.com`,
      role: "USER",
      password: "123456@Aa",
      ID_Verified: true, 
      emailVerified: true,
      isInvestor: true,
      nationalId: `3025031234534${i+1}`,
    });
  }
  // 🧪 Seed 5 Partners Users
  for (let i = 0; i < 5; i++) {
    await User.create({
      fullName: `Partner ${i}`,
      email: `partner${i}@gmail.com`,
      role: "PARTNER",
      password: "123456@Aa",
      emailVerified: true,
    });
  }

  // 🧪 Seed 5 Properties 
  for (let i = 0; i < 5; i++) {
  await Property.create({
      title: `Property ${i}`,
      description: `Address ${i}`,
      city: `City ${i}`,
      locationLink: `Country ${i}`,
      size: `Description ${i}`,
      numOfRooms: 5,
      images: ["https://cdn.pixabay.com/photo/2017/06/16/15/58/luxury-home-2409518_960_720.jpg"],
      totalShares: 5,
      availableShares: 5,
      pricePerShare: 500,
      estimatedExitDate: new Date(),
      rentalIncome: 500,
      status: "AVAILABLE",
      rentalName: "Rental Name",
      rentalStartDate: new Date(),
      rentalEndDate: new Date(),
      benefits: "Benefits",
      managementCompany: "Management Company",
      status: "AVAILABLE",
      investmentDocs: ["https://cdn.pixabay.com/photo/2017/06/16/15/58/luxury-home-2409518_960_720.jpg"],
      propertyDocs: ["https://cdn.pixabay.com/photo/2017/06/16/15/58/luxury-home-2409518_960_720.jpg"],
    });
  }
  

});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
