const express = require('express');
const morgan = require('morgan');
const passport = require('./Config/passport');
const session = require('express-session');
const adminRouter = require('./Routes/adminRoutes');
const authRouter = require('./Routes/authRoutes');
const investmentRouter = require('./Routes/investmentRoutes');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/admin', adminRouter);
app.use('/auth', authRouter);
app.use('/investment', investmentRouter);

module.exports = app;
