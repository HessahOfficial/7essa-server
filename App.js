const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const corsOptions = require('./Config/corsOptions')
const passport = require('./Config/passport');
const session = require('express-session');
const adminRouter = require('./Routes/adminRoutes');
const authRouter = require('./Routes/authRoutes');
const investmentRouter = require('./Routes/investmentRoutes');
const userRouter = require('./Routes/userRoutes');
const paymentRouter = require('./Routes/paymentRoutes');
const propertyRouter = require('./Routes/propertyRoutes');
const { allowedTo, authenticateAccessToken } = require('./Middlewares/authMiddleware');
const AppError = require('./utils/appError');
const userRoles = require('./utils/constants/userRoles');

const app = express();

app.use(cors(corsOptions));
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
app.get('/', (req, res) => {
  res.send('Welcome from the server');
}
);

app.use('/admin', authenticateAccessToken, allowedTo(userRoles.ADMIN), adminRouter);
app.use('/auth', authRouter);
app.use('/investment', investmentRouter);
app.use("/users", userRouter);
app.use('/payments', paymentRouter);
app.use('/properties', propertyRouter);

//global error handler
app.use((err, req, res, next) => {

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.statusCode || 500,
      data: null,
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
});
module.exports = app;
