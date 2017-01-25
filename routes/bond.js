var express = require('express');
var router = express.Router();

var http = require('http');
var querystring = require('querystring');
var config = require('../modules/config');

//var log4js = require('../modules/log4js');
//var log=log4js('sbweb.log');

var util = require('../modules/utility');

/* 債券庫存查詢 */
router.get('/qry/inv', function(req, res, next) {

    var login_flag = req.session.login_flag;    
    var login_id = req.session.user_profile.id;
    var login_grp = req.session.user_profile.group;

    var errmsg = "";
    var recv_jd = {};

    //logger.info("[bond.js] == Start == (" + login_id + ") Group:" + login_grp);     

    //log
    var router_name = "bond/qry/inv";
    var key = req.session.user_request_info;
    var info = "";
    util.loggerInfo("START",router_name,login_id,key);  
    util.loggerInfo("",router_name,login_id,"Group:" + login_grp + ","+key);         

    var cus_idno = "";
    var cus_cus_acc = "";
    var cus_broker = "";
    var open_belong = "";
    if (login_flag){   
        if (req.session.hasOwnProperty("customer")){     
            cus_idno = req.session.customer.idno; 
            cus_cus_acc = req.session.customer.cus_acc;
            cus_broker = req.session.customer.broker;
            open_belong = req.session.customer.open_belong;
        }else{
            //No Customer
            //logger.info("[bond.js] (" + login_id + ") No Customer!!"); 
            util.loggerInfo("",router_name,login_id,"No Customer!!,"+key);      
        }
    }else{
        cus_idno = login_id;
        cus_cus_acc = req.session.user_profile.cus_acc;
        cus_broker = req.session.user_profile.broker;
        open_belong = req.session.user_profile.open_belong;
    }

    //logger.info("[bond.js] (" + login_id +") query cus_idno:" + cus_idno + ",cus_cus_acc:" + cus_cus_acc + ",cus_broker:" + cus_broker);   
    //logger.info("[bond.js] (" + login_id +") login_flag=" + req.session.login_flag + ",admin_flag=" + req.session.admin_flag + ",ae_flag=" + req.session.ae_flag); 

    util.loggerInfo("",router_name,login_id,"query cus_idno:" + cus_idno + ",cus_cus_acc:" + cus_cus_acc + ",cus_broker:" + cus_broker+",open_belong:" + open_belong+","+key);  
    util.loggerInfo("",router_name,login_id,"login_flag=" + req.session.login_flag + ",admin_flag=" + req.session.admin_flag + ",ae_flag=" + req.session.ae_flag + ","+key);    

    //2017/01/05
    if (cus_broker=="9A95") cus_broker = open_belong;

    //** 送出查詢前 Check ***********************************
    var pass = false;
    if (!cus_idno){        
        errmsg = "請先輸入查詢帳號!";        
    }else if (isNaN(cus_cus_acc)){
        errmsg = "帳號不合法!";
    }else{
        pass = true;
    }

    if (!pass){   
        //== 失敗 ===================================================================/  
        logger.info("[bond.js] (" + login_id + ") Check Not Pass! errmsg:" + errmsg);  
        util.loggerInfo("",router_name,login_id,"Check Not Pass! errmsg:" + errmsg + ","+key); 

        var recv_jd = {};

        recv_jd["header"] = "債券庫存查詢";
        recv_jd["original_url"] = req.originalUrl;
        if (errmsg!=''){
            var msg = util.addAlertMsg(null, 'danger', errmsg);
            recv_jd["msg"] = msg;
        }

        var recv_json = util.getSession2Json(true,recv_jd,req.session); 
        res.render('bond_qry_inv',recv_json);

    }else{
        //== 成功 =================================================================/  
        var perm = "{\"idno\":\"" + cus_idno + "\",\"broker\":\"" + cus_broker + "\",\"cus_acc\":\"" + cus_cus_acc + "\"}";
        //logger.info("[bond.js] (" + login_id + ") Check Pass! request perm:" + perm);  
        util.loggerInfo("",router_name,login_id,"Check Pass! request perm:" + perm + ","+key); 

        var options = {
            host: config.sbserver.host,
            port: config.sbserver.port,
            path: '/bond/GetBondInventory/'+ perm,
            method: 'GET'
        };

        //logger.info("[bond.js] (" + login_id + ") Call Server >> path:" + options.path);    
        util.loggerInfo("",router_name,login_id,"Call Server >> path:" + options.path + ","+key); 

        http.request(options, function(response) {
            var recv = '';

            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                recv += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                try{ 
                    var json = JSON.parse(recv);
                    recv_jd = json;
                    //logger.info("[bond.js] (" + login_id + ") ,result:"+json._server.result+",errmsg:"+json._server.errmsg);
                    util.loggerInfo("",router_name,login_id,"result:"+json._server.result+",errmsg:"+json._server.errmsg + ","+key); 

                    if(json._server.result=='OK'){  
                        //-- 成功 --------------------------------------------/                        
                    }else{
                        //-- 查詢失敗 -------------------------------------/
                        errmsg = "查詢失敗:" + json._server.errmsg;
                    }

                    recv_jd["header"] = "債券庫存查詢";
                    recv_jd["original_url"] = req.originalUrl;
                    if (errmsg!=''){
                        var msg = util.addAlertMsg(null, 'danger', errmsg);
                        recv_jd["msg"] = msg;
                    }
                    
                    var recv_json = util.getSession2Json(true,recv_jd,req.session);    
                    //logger.info("[bond.js] == End == (" + login_id + ") ,errmsg=" + errmsg);   
                    util.loggerInfo("",router_name,login_id,"errmsg:"+ errmsg + ","+key); 
                    util.loggerInfo("END",router_name,login_id,key); 
                    res.render('bond_qry_inv',recv_json);

                }catch(err){
                    logger.error("[Execption] " + err);
                    res.render('error',{"message":"Error! (1)"});
                }
            });
        }).on('error', function (e) {
            logger.error(`[Execption] problem with request: ${e.message}`);
            console.log(`problem with request: ${e.message}`);
            res.render('error',{"message":"Error! (2)"});
        }).end();
        //--------------------------------------------------------
    }  

});

module.exports = router;
