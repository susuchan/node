var express = require('express');
var router = express.Router();
//var sbservice = require('../modules/sbservice.js');

var http = require('http');
var querystring = require('querystring');
var config = require('../modules/config');
var util = require('../modules/utility');

router.get('/close', function(req, res, next) {
   
    var recv_jd = {};
    recv_jd["layout"] = false;
    res.render('close',recv_jd);

});

/* GET home page. */
router.get('/', function(req, res, next) {
   
    var recv_jd = {};
    recv_jd["layout"] = false;
    recv_jd["login_flag"] = false;

    var ae_customer = {};
    var login_grp = req.session.user_profile.group;
    var login_id = req.session.user_profile.id;

    recv_jd["signin"] = req.session.signin;  
    
    //for login user info 
    recv_jd["login_id"] = req.session.user_profile.id;
    recv_jd["username"] = req.session.user_profile.name;  
    var cus_acc = (req.session.user_profile.cus_acc == undefined) ? "" : req.session.user_profile.cus_acc;
    var broker = (req.session.user_profile.broker == undefined) ? "" : req.session.user_profile.broker;
    var open_belong = (req.session.user_profile.open_belong == undefined) ? "" : req.session.user_profile.open_belong;
    if (broker=="9A95") broker = open_belong;
    var show_cus_acc = "";
    if (cus_acc!=""){
        show_cus_acc = (broker!="") ? "(" + broker + "-" + cus_acc + ")" : "(" + cus_acc + ")";
    }else{
        show_cus_acc = (broker!="") ?  "(" + broker + ")" : "";
    }
    recv_jd["cus_acc"] = show_cus_acc;
    
    res.render('home',recv_jd);

});

if(config.ae_router){
    router.get('/AE', function(req, res, next) {
    
        var recv_jd = {};
        recv_jd["layout"] = false;
        recv_jd["login_flag"] = true;

        var ae_customer = {};
        var login_grp = req.session.user_profile.group;
        var login_id = req.session.user_profile.id;

        //Group Filter    
        if (req.session.isAdminGrp(login_grp)){                                
            req.session.admin_flag = true;                                                              
            recv_jd["admin_flag"] = true;                                                           
        } else if (req.session.isGrp('AE')){   
            req.session.ae_flag = true;
            recv_jd["ae_flag"] = true;   
            ae_customer = util.getAECustomer(req.session.user_profile);
        }

        //Check Customer idno
        if (!req.session.isGrp('CLIENT')){
            recv_jd["check_cus"] = util.checkCus(req.session);
        }

        recv_jd["ae_customer"] = ae_customer;    
        recv_jd["signin"] = req.session.signin;  


        //for login user info 
        recv_jd["login_id"] = req.session.user_profile.id;
        recv_jd["username"] = req.session.user_profile.name;  

        var cus_acc = (req.session.user_profile.cus_acc == undefined) ? "" : req.session.user_profile.cus_acc;
        var broker = (req.session.user_profile.broker == undefined) ? "" : req.session.user_profile.broker;
        var open_belong = (req.session.user_profile.open_belong == undefined) ? "" : req.session.user_profile.open_belong;
        if (broker=="9A95") broker = open_belong;
        var show_cus_acc = "";
        if (cus_acc!=""){
            show_cus_acc = (broker!="") ? "(" + broker + "-" + cus_acc + ")" : "(" + cus_acc + ")";
        }else{
            show_cus_acc = (broker!="") ?  "(" + broker + ")" : "";
        }
        recv_jd["cus_acc"] = show_cus_acc;

        //for admin customer info
        recv_jd["cus_idno"] = req.session.cus_idno;
        recv_jd["cus_username"] = req.session.cus_username;   
        if (req.session.hasOwnProperty("customer")){
            recv_jd["cus_cus_acc"] = (req.session.customer.cus_acc == undefined) ? "" : req.session.customer.cus_acc;
            var cus_broker = (req.session.customer.broker == undefined) ? "" : req.session.customer.broker;
            if (cus_broker=="9A95") cus_broker = (req.session.customer.open_belong == undefined) ? "" : req.session.customer.open_belong;
            recv_jd["cus_broker"] = cus_broker;
        }

        recv_jd["original_url"] = req.originalUrl;        
        res.render('home',recv_jd);

    });
}

module.exports = router;