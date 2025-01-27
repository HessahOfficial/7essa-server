const dotenv = require('dotenv');
const connectDB = require('./Config/dbConfig');

const app = require('./app');
dotenv.config();
connectDB();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});
