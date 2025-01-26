const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = require('./App');

const port = process.env.PORT;
const DB = process.env.DATABASE_Hisham;

mongoose
  .connect(DB, {
    // .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful');
  });
app.listen(port, () => {
  console.log(`App is running on port ${port} `);
});
