const app = require('./App');
const dotenv = require('dotenv');
const express = require('express');
dotenv.config();
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`App is running on port ${port} `);
});
