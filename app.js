const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const cors = require('cors');
const PATH = process.env.PORT || 3000;

const MONGODB_URL = 'mongodb+srv://zircadia:jojojojo12@udemy.lmppa.mongodb.net/shop';

const errorController = require('./controllers/error');
const User = require('./models/user');

const corsOptions = {
  origin: "https://nodemaxmongoose.herokuapp.com/",
  optionsSuccessStatus: 200
};

const options = {
  family: 4
};

const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: 'sessions',
  useUnifiedTopology: true 
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'somethinghere', resave: false, saveUninitialized: false, store: store, sameSite: "lax"}));
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if(!req.session.user) {
  return next();}
  else {
  User.findById(req.session.user._id)
  .then(user => {
    if(!user) {
      return next();
    }
    req.user = user;
    next();})
  .catch(err => {
    next(new Error(err)); 
  });
}});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  csrfToken = req.csrfToken();
  console.log(req.body);
  res.status(500).render('500', { pageTitle: 'Error Occurred', path: '/500',
  isAuthenticated: req.session.isLoggedIn,
  csrfToken: csrfToken,
  cartLength: '',
 });
  
});

mongoose
  .connect(
    MONGODB_URL,{ useNewUrlParser: true, useUnifiedTopology: true }, options
  )
  .then(result => {
    app.listen(PATH);
  })
  .catch(err => {
    console.log(err);
  });
