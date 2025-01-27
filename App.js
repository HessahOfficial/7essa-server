const express = require('express');
const adminRouter = require('./Routes/adminRoutes');
const authRouter = require('./Routes/authRoutes');
const morgan = require('morgan');

const app = express();
app.use(morgan('dev'));
app.use(express.json());

app.use('/admin', adminRouter);
app.use('/auth', authRouter);

module.exports = app;
