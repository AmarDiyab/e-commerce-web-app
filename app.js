var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
var fileUpload = require('express-fileupload');
var db = require('./config/connection');
var Handlebars = require("handlebars");
var session = require('express-session');

db.connect((err)=> {
  if (err) console.log("ERROR" + err)
  else console.log("Database Connected")
})

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs',hbs.engine({extname:'hbs', defaultLayout:'layout', layoutsDir: __dirname +'/views/layout', partialsDir: __dirname + '/views/partials/'}))

process.env.PWD = process.cwd()
app.use(express.static(process.env.PWD + '/public/product-images'));  

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

app.use(session({
  secret: "Key",
  cookie: { maxAge:600000 },
  resave: true,
  saveUninitialized: true
}))

app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;