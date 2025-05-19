const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const corsOptions = require('./Config/corsOptions');
const passport = require('./Config/passport');
const session = require('express-session');
const adminRouter = require('./Routes/adminRoutes');
const authRouter = require('./Routes/authRoutes');
const investmentRouter = require('./Routes/investmentRoutes');
const userRouter = require('./Routes/userRoutes');
const paymentRouter = require('./Routes/paymentRoutes');
const propertyRouter = require('./Routes/propertyRoutes');

const { verifyToken } = require('./Middlewares/verifyToken');
const  allowedTo  = require('./Middlewares/allowedTo');


const userRoles = require('./utils/constants/userRoles');
const httpStatusText = require('./utils/constants/httpStatusText');

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
});

app.use(
  '/admin',
  verifyToken,
  allowedTo(userRoles.ADMIN),
  adminRouter,
);
app.use('/auth', authRouter);
app.use('/investments', investmentRouter);
app.use('/users', userRouter);
app.use('/payments', paymentRouter);
app.use('/properties', propertyRouter);

//global error handler
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    status: error.statusText || httpStatusText.ERROR,
    message: error.message,
    code: error.statusCode || 500,
    data: null,
  });
});
module.exports = app;

