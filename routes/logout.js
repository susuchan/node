var express = require('express');
var router = express.Router();
//var sbservice = require('../modules/sbservice.js');

var http = require('http');
var querystring = require('querystring');
var config = require('../modules/config');

var log4js = require('../modules/log4js');
var log=log4js('sbweb.log');

/* GET home page. */
router.get('/', function(req, res, next) {

    // 登出，清空 session
    delete req.session.user_profile;
    delete req.session.customer;
    delete req.session.cus_idno;
    delete req.session.cus_username;
    delete req.session.in_bank_info;

    req.session.signin = false;
    req.session.admin_flag = false;
    req.session.ae_flag = false;

    var recv_jd = {};
    recv_jd["layout"] = false;
    recv_jd["signin"] = req.session.signin;  
    recv_jd["login_flag"] = req.session.login_flag;

    res.render('home',recv_jd);

});

module.exports = router;