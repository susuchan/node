
var express = require('express');
var router = express.Router();
var http = require('http');
var querystring = require('querystring');
var config = require('../modules/config');

//var log4js = require('../modules/log4js');
//var log=log4js('sbweb.log');

var util = require('../modules/utility');

//************************************************
//**  切換客戶
//************************************************
router.post('/customer', function(req, res, next) {

    if (!req.body.cus_idno){
        var recv_jd = {};
        recv_jd["alert_msg"] = "請輸入切換之客戶身份證!";
        var recv_json = util.getSession2Json(false,recv_jd,req.session); 
        res.render('home',recv_json);
        return false;
    }

    //Get Request Params
    var in_cus_idno = req.body.cus_idno.trim();
    var original_url = req.body.original_url.trim();

    var recv_jd = {};

    var perm=req.session.user_profile;    
    var alert_msg = "";
    var pass = false;

    var login_id = req.session.user_profile.id;
    var login_grp = req.session.user_profile.group;    

    //log
    var router_name = "change/customer";
    var key = req.session.user_request_info;
    var info = "";
    util.loggerInfo("START",router_name,login_id,key);

    //Change Customer 成功後轉到原始 URL
    var parents_url = req.protocol + '://' + req.get('host') + original_url;
    if (original_url == "" && req.session.isAdminGrp(login_grp)){
        parents_url += "/AE";
    }    

    //logger.info("[change.js /customer] == Start == (" + login_id + ") ,Group:" + login_grp + ",change cus_idno:" + in_cus_idno);    
    info = "Group:" + login_grp + ",change cus_idno:" + in_cus_idno;
    util.loggerInfo("",router_name,login_id,info+","+key);

    try {
        
        if (req.session.isAdminGrp(login_grp)){   
            //## admin 權限,所有客戶都可以查,不檢查客戶 
            pass = true;
        }else if (req.session.isGrp('AE')){
            //## ae 權限,檢查客戶是否為 hierarchy 中的客戶   
            var ae_customer = util.getAECustomer(req.session.user_profile);
            if (ae_customer.cus_cnt <= 0){
                alert_msg = "無客戶可切換";
            }else{
                var customer = ae_customer.customer;
                for (i=0; i< customer.length; i++){
                    if (customer[i].idno == in_cus_idno){
                        //## 通過檢查, PASS 
                        req.session.customer = customer[i];
                        pass = true;
                        break;
                    }
                }
            }
            if (!pass){
                alert_msg = in_cus_idno + "非所屬客戶";
            }

            /*if(!perm.hasOwnProperty('hierarchy')){
                alert_msg = "無客戶可切換 (1)";
            }else if (!perm.hierarchy.hasOwnProperty(login_id)){
                alert_msg = "無客戶可切換 (2)";
            }else if (!perm.hierarchy[login_id].hasOwnProperty('customer')){
                alert_msg = "無客戶可切換 (3)";
            }else{
                var customer = perm.hierarchy[login_id].customer;
                for (i=0; i< customer.length; i++){
                    if (customer[i].idno == in_cus_idno){
                        //## 通過檢查, PASS 
                        req.session.customer = customer[i];
                        pass = true;
                        break;
                    }
                }
                if (!pass){
                   alert_msg = in_cus_idno + "非所屬客戶";
                }
            }
            var ae_customer = util.getAECustomer(req.session.user_profile);*/
        }else {
            alert_msg = "非管理者";
        }

        if (!pass){
            //** NOT PASS: 沒有通過檢查 ************************************* 
            //logger.info("[change.js /customer] (" + login_id + ") ,Change Fail! change cus_idno:" + in_cus_idno + ",alert_msg:" + alert_msg);
            info = "Change Fail! change cus_idno:" + in_cus_idno + ",alert_msg:" + alert_msg;
            util.loggerInfo("",router_name,login_id,info+","+key);

            recv_jd["alert_msg"] = alert_msg;
            recv_jd["ae_customer"] = ae_customer; 
            var recv_json = util.getSession2Json(false,recv_jd,req.session); 
            res.render('home',recv_json);

        }else{
            //** PASS: 通過檢查,設定客戶 *************************************
            //logger.info("[change.js /customer] (" + login_id + ") ,Change OK! change cus_idno:" + in_cus_idno);  
            info = "Change OK! change cus_idno:" + in_cus_idno;
            util.loggerInfo("",router_name,login_id,info+","+key);

            if (req.session.isAdminGrp(login_grp)){ 
                //Admin group, 需依 cus_idno 取得 customer info --------------------
                //logger.info("[change.js /customer] (" + login_id + ") ,in_cus_idno:" + in_cus_idno);                 

                var options = {
                    host: config.sbserver.host,
                    port: config.sbserver.port,
                    path: '/cus/GetCusInfo/' + in_cus_idno,
                    method: 'GET'
                };

                //logger.info("[change.js /customer] (" + login_id + ") Call Server >> path:" + options.path);  
                info = "Call Server >> path:" + options.path;
                util.loggerInfo("",router_name,login_id,info+","+key);

                http.request(options, function(response) {
                    var recv = '';

                    //another chunk of data has been recieved, so append it to `str`
                    response.on('data', function(chunk) {
                        recv += chunk;
                    });

                    //the whole response has been recieved, so we just print it out here
                    response.on('end', function() {

                        try {
                            var json = JSON.parse(recv);
                            var recv_jd = {};
                            var errmsg = "";
                            //logger.info("[change.js /customer] (" + login_id + ") ,result:"+json._server.result+",errmsg:"+json._server.errmsg);
                            info = "result:"+json._server.result+",errmsg:"+json._server.errmsg;
                            util.loggerInfo("",router_name,login_id,info+","+key);

                            if(json._server.result=='OK'){  
                                //** 成功 **************************************/   
                                req.session.customer = json;     
                                req.session.cus_idno = req.session.customer.idno;
                                req.session.cus_username = req.session.customer.name;
                                req.session.cus_cus_acc = req.session.customer.acc_cus;
                                //req.session.cus_broker = req.session.customer.broker;
                                var cus_broker = req.session.customer.broker;
                                if (cus_broker=="9A95") cus_broker = req.session.customer.open_belong;
                                req.session.cus_broker = cus_broker; 

                                //取得 default bank acc 
                                var default_bank = util.getDefaultBank(req.session);
                                if (default_bank!=false){
                                    req.session.in_bank_info = default_bank;
                                }   

                                //logger.info("[change.js /customer] == End == (" + login_id + ") ,url=" + parents_url);     
                                info = "redirect url=" + parents_url;
                                util.loggerInfo("",router_name,login_id,info+","+key);
                                util.loggerInfo("END",router_name,login_id,key);

                                res.redirect(parents_url);                
                            }else{
                                //** 查詢失敗 **************************************/
                                alert_msg = "查詢失敗:" + json._server.errmsg;
                                recv_jd["alert_msg"] = alert_msg;
                                var recv_json = util.getSession2Json(false,recv_jd,req.session); 
                                res.render('home',recv_json);
                            } 

                        } catch (err) {
                            logger.error("[Execption] " + err);
                            res.render('error',{"message":"Error! (1)"});
                        }


                    });

                }).on('error', function(e) {
                    logger.error(`[Execption] problem with request: ${e.message}`);
                    console.log(`problem with request: ${e.message}`);
                    res.render('error',{"message":"Error! (2)"});
                }).end();
                //----------------------------------------------------------------

            }else if (req.session.isGrp('AE')){
                //AE group, 直接從 customer 取得客戶資料                
                req.session.cus_idno = req.session.customer.idno;
                req.session.cus_username = req.session.customer.name;
                req.session.cus_cus_acc = req.session.customer.acc_cus;
                //req.session.cus_broker = req.session.customer.broker;
                var cus_broker = req.session.customer.broker;
                if (cus_broker=="9A95") cus_broker = req.session.customer.open_belong;
                req.session.cus_broker = cus_broker; 

                //取得 default bank acc 
                var default_bank = util.getDefaultBank(req.session);
                if (default_bank!=false){
                    req.session.in_bank_info = default_bank;
                }                 

                info = "redirect url=" + parents_url;
                util.loggerInfo("",router_name,login_id,info+","+key);
                util.loggerInfo("END",router_name,login_id,key);
                //logger.info("[change.js /customer] == End == (" + login_id +")");
                res.redirect(parents_url);
            }
        }        

    }catch(err){
        log.error("[Execption] " + err);
        res.render('error',{"message":"Error! (3)"});
    }

});

module.exports = router;