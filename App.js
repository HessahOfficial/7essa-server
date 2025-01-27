const express = require('express');
const adminRouter = require('./Routes/adminRoutes');

const app = express();
app.use(express.json());
app.use('/admin', adminRouter);

module.exports = app;