//Handles all backend

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ex_session = require('express-session');
var methodOverride = require('method-override');
var bcrypt = require("bcryptjs"); // use pure JS implementation to avoid native module deprecation warnings
var pug= require('pug');


var username = "sherpa_14";
var password = "geocode";
// Hash synchronously so password is ready before any login request (avoids race with async hash)
password = bcrypt.hashSync(password, 10);



var routes = require('./routes/index');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(methodOverride());
    app.use(cookieParser());
    // express-session needs explicit resave/saveUninitialized flags to silence deprecation warnings
    app.use(ex_session({
      secret: 'cmps369',
      resave: false,
      saveUninitialized: false
    }));
    app.use(express.static(path.join(__dirname, 'public')));




// Set up passport to help with user authentication (guest/password)
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },

    function(user, pswd, done) {
        if ( user != username ) {
            console.log("Username mismatch");
            return done(null, false);
        }

        bcrypt.compare(pswd, password, function(err, isMatch) {
            if (err) return done(err);
            if ( !isMatch ) {
                console.log("Password mismatch");
            }
            else {
                console.log("Valid credentials");
            }
            done(null, isMatch);
        });
      }
  ));

  passport.serializeUser(function(username, done) {
      // this is called when the user object associated with the session
      // needs to be turned into a string.  Since we are only storing the user
      // as a string - just return the username.
      done(null, username);
  });

  passport.deserializeUser(function(username, done) {
      // normally we would find the user in the database and
      // return an object representing the user (for example, an object
      // that also includes first and last name, email, etc)
      done(null, username);
   });


// Posts to login will have username/password form data.
// passport will call the appropriate functions...
routes.post('/login',
    passport.authenticate('local', { successRedirect: '/contacts',
                                     failureRedirect: '/login_fail',
                                  })
);

routes.get('/login', function (req, res) {
  res.render('login', {});
});

routes.get('/login_fail', function (req, res) {
  res.render('login_fail', {});
});

routes.get('/logout', function (req, res, next) {
  // Passport 0.6+ requires a callback; also make sure we fully clear the session
  req.logout(function (err) {
    if (err) { return next(err); }
    req.session.destroy(function () {
      res.redirect('/login');
    });
  });
});

app.use('/', routes);

// Traffic Insights (React SPA) – serve built assets and SPA fallback
var trafficDist = path.join(__dirname, 'traffic-app', 'dist');
app.use('/traffic', express.static(trafficDist));
app.get('/traffic/*', function (req, res) {
  res.sendFile(path.join(trafficDist, 'index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;




/**
 * Module dependencies.
 */

 var debug = require('debug')('guess:server');
 var http = require('http');
 
 /**
  * Get port from environment and store in Express.
  */
 
 var port = normalizePort(process.env.PORT || '3000');
 app.set('port', port);
 
 /**
  * Create HTTP server and listen after DB is ready.
  */
 var server = http.createServer(app);
 var hostname = '127.0.0.1';

 (async function () {
   await routes.dbReady;
   server.listen(port, hostname);
   server.on('error', onError);
   server.on('listening', onListening);
 })();
 
 /**
  * Normalize a port into a number, string, or false.
  */
 
 function normalizePort(val) {
   var port = parseInt(val, 10);
 
   if (isNaN(port)) {
     // named pipe
     return val;
   }
 
   if (port >= 0) {
     // port number
     return port;
   }
 
   return false;
 }
 
 /**
  * Event listener for HTTP server "error" event.
  */
 
 function onError(error) {
   if (error.syscall !== 'listen') {
     throw error;
   }
 
   var bind = typeof port === 'string'
     ? 'Pipe ' + port
     : 'Port ' + port;
 
   // handle specific listen errors with friendly messages
   switch (error.code) {
     case 'EACCES':
       console.error(bind + ' requires elevated privileges');
       process.exit(1);
       break;
     case 'EADDRINUSE':
       console.error(bind + ' is already in use');
       process.exit(1);
       break;
     default:
       throw error;
   }
 }
 
 /**
  * Event listener for HTTP server "listening" event.
  */
 
 function onListening() {
   var addr = server.address();
   var bind = typeof addr === 'string'
     ? 'pipe ' + addr
     : 'port ' + addr.port;
   debug('Listening on ' + bind);
 }
 
