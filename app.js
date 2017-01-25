var express = require('express'),
    app = express(),
    guid = require('guid');

// 路徑
var path = require('path'),
    path_public = path.join(__dirname, 'public'),
    path_modules = path.join(__dirname, 'modules'),
    path_routes = path.join(__dirname, 'routes');


// Global Logger
global.logger = require(path_modules + '/log4js')('sbweb.log');

// 系統設定
var config = require(path_modules+'/config');

// Log 模組
// 檢查是否有log目錄
var fs = require('fs');
var dir = '../log';
if (! fs.existsSync(dir)) fs.mkdirSync(dir);
app.use(require('morgan')('dev'));

// 網頁樣版引擎 Handlebars (.hbs)
var hbs = require('express-handlebars')
          .create(require(path_modules+'/handlebars_props.js'));

/*var hbs = require('express-handlebars').create(module.exports = {
    defaultLayout: 'layout',
    extname: '.hbs',    
    helpers: require(path_modules+'/helpers/handlebars_helper.js').helpers,    
    
});*/


app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// Store of Sessions (redis or mongodb or native)
var session = require('express-session');
var session_props={
  secret: guid.raw()+guid.raw(),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1800000 }
}
if(config.session == "redis"){

  var RedisStore = require('connect-redis')(session);
  session_props.store = new RedisStore(config.redis);

}else if(config.session == "mongodb"){

  var MongoStore = require('connect-mongo')(session);
  session_props.store = new MongoStore(config.mongodb)

}
app.use(session(session_props));

// cookie
app.use(require('cookie-parser')());

// bodyParser
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// http header 安全性修正
app.use(require('helmet')());

// http壓縮
app.use(require('compression')()); // or ngx_http_gzip_module 

// Static contents
app.use(express.static(path_public));
app.use(require('serve-favicon')(path_public+'/favicon.ico'));

// log前置處理
app.use(require(path_modules+'/request_log.js'));

// 權限管理器
app.use(require(path_modules+'/auth'));

// {{{ Routes }}}
// ==================================================
app.use('/', require(path_routes+'/home'));
app.use('/AE', require(path_routes+'/home'));
app.use('/bond', require(path_routes+'/bond'));
app.use('/login', require(path_routes+'/login'));
app.use('/logout', require(path_routes+'/logout'));
app.use('/bank', require(path_routes+'/bank'));
app.use('/change', require(path_routes+'/change'));
app.use('/trust', require(path_routes+'/trust'));
// ==================================================


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

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
