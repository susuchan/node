var express = require('express');
var router = express.Router();
var http = require('http');
var querystring = require('querystring');
var config = require('../modules/config');
var util = require('../modules/utility.js');
//var log4js = require('../modules/log4js');
//var log=log4js('trust.log');

////////////////////////////////
// 可做Trust Client定義
var TRUST_OTP = { EZTRADE:true }; // OTP方式 之 CompID允許清單
var TRUST_MD5 = { BTS:true, WWWPortal:true }; // MD5演算方式 之 CompID允許清單

//BTS --> AE login
//EZTRADE --> Customer

// MD5
// 計算公式 UserID:123456 , SSOTime:ab:cd:ef
// '1234' + 'Wm15' + 'b:cd:e' + '3456' + 'MvC4';
//    {sample} UserID:000770 , SSOTime:00:11:22
//           --> 0007Wm150:11:20770MvC4 --> {MD5} 3525e4e72b5c8f2f53bc2f84b9349e49
// localhost:3000/trust?IP=127.0.0.1&CompID=BTS&SSOID=SBWEB&UserID=000770&SSOTime=00:11:22&MD5=3525e4e72b5c8f2f53bc2f84b9349e49
//

router.get('/', function(req, res, next) { 

    //設定參數 -------------------------
    var client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var CompID='',Param={};    
    Param['IP'] = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var goto_url = "/bond/qry/inv";
    let _error;

    //log
    var router_name = "trust";
    var key = req.session.user_request_info;
    var info = "";
    var UserID = "";
    util.loggerInfo("START",router_name,UserID,key);        

    try {        
        if (req.query.EZURL) {
            //EZTRADE未傳入CompID，暫用EZURL判斷
            CompID = 'EZTRADE';
            //Param['OTP_URL'] = req.query.EZURL //URL不encode會造成server:404
            
            //logger.info("[trust.js] == Start == CompID=" + req.query.CompID + "&IDNO=" + req.query.IDNO + "&ONCEPWD=" + req.query.ONCEPWD + ',client_ip=' + client_ip);
            info = "CompID=" + req.query.CompID + "&IDNO=" + req.query.IDNO + "&ONCEPWD=" + req.query.ONCEPWD + ',client_ip=' + client_ip;
            util.loggerInfo("",router_name,UserID,info+","+key);

            UserID = req.query.IDNO;
        } else {
            CompID = req.query.CompID;
            //logger.info("[trust.js] == Start == CompID=" + req.query.CompID + "&SSOID=" + req.query.SSOID + "&UserID=" + req.query.UserID + "&SSOTime=" + req.query.SSOTime + "&MD5=" + req.query.MD5 + ',client_ip=' + client_ip);
            info = "CompID=" + req.query.CompID + "&SSOID=" + req.query.SSOID + "&UserID=" + req.query.UserID + "&SSOTime=" + req.query.SSOTime + "&MD5=" + req.query.MD5 + ',client_ip=' + client_ip;
            util.loggerInfo("",router_name,UserID,info+","+key);
            UserID = req.query.UserID;
        }
        Param['CompID'] = CompID;

        if (TRUST_OTP.hasOwnProperty(CompID) && TRUST_OTP[CompID]) {

            Param['IDNO'] = req.query.IDNO;
            Param['OTP'] = req.query.ONCEPWD;
            Param['TCODE'] = req.query.TCODE;//股票:T01, 債券:T02, 基金: T03

        } else if (TRUST_MD5.hasOwnProperty(CompID) && TRUST_MD5[CompID]) {

            Param['UserID'] = req.query.UserID;
            Param['SSOID'] = req.query.SSOID;
            Param['SSOTime'] = req.query.SSOTime;
            Param['MD5'] = req.query.MD5;

        } else {
            //res.end(util.getResponseStr('FAIL', '參數錯誤', req.query)); //Cause _http_outgoing.js:356    throw new Error('Can\'t set headers after they are sent.');//Immediate crash
            //return;
            _error = util.getResponseStr('FAIL', '參數錯誤', req.query);
        }
    } catch (err) {
        _error = util.getResponseStr('FAIL', err, req.query);
        //return;
    }

    try{
        if(_error){
            throw new Error(_error);
        }
        logger.info("[trust.js] request: Param=" + JSON.stringify(Param));
        var options = {
                        host: config.sbserver.host,
                        port: config.sbserver.port,
                        path: '/trust_api/'+JSON.stringify(Param),
                        method: 'GET'
                      };                      

        http.request(options, function(response) {
            var recv = '';

            response.on('data', function(chunk) {
                recv += chunk;
            });

            response.on('end', function() {
                try {

                    var json=JSON.parse(recv);
                    var pass = false;
                    var errmsg = "";

                    //logger.info("[trust.js] (" + UserID +") result=" + json._server.result + ",errmsg=" + json._server.errmsg);
                    info = "result=" + json._server.result + ",errmsg=" + json._server.errmsg;
                    util.loggerInfo("",router_name,UserID,info+","+key);

                    if(json._server.result=='OK'){
                        if (!json.user_profile || !json.user_profile.id){
                            errmsg = "帳號資料有誤";
                        }else{ 
                            req.session.user_profile = json.user_profile;
                            logger.info("[trust.js] (" + UserID +") CompID=" + CompID + ",Group=" + req.session.user_profile.group);
                            if (CompID == "BTS"){
                                if (req.session.isGrp('AE')){
                                    //2017.01.12
                                    var ae_customer = util.getAECustomer(req.session.user_profile);
                                    info = "role:"+ req.session.user_profile.role + ",belong_unit:"+ req.session.user_profile.belong_unit + ",customer.length:"+ ae_customer.cus_cnt;
                                    util.loggerInfo("",router_name,UserID,info+","+key);

                                    if (ae_customer.cus_cnt>0 && ae_customer.default_cus.hasOwnProperty("idno")){
                                        pass = true;                                       
                                    }else{
                                        pass = false;
                                        errmsg = "查無任何所屬客戶!";
                                        info = "Error!! Not Found Customer";
                                        util.loggerInfo("",router_name,UserID,info+","+key);
                                    }                                   

                                    /*info = "customer.length:"+ json.user_profile.hierarchy[json.user_profile.id].customer.length;
                                    util.loggerInfo("",router_name,UserID,info+","+key);
                                    if (json.user_profile.hierarchy[json.user_profile.id].hasOwnProperty("customer") && json.user_profile.hierarchy[json.user_profile.id].customer.length > 0) {
                                        pass = true;
                                    }else{
                                        pass = false;
                                        errmsg = "查無任何所屬客戶!";
                                        //logger.info("Error!! Not Found Customer");
                                        info = "Error!! Not Found Customer";
                                        util.loggerInfo("",router_name,UserID,info+","+key);
                                    }  */                                 
                                }else{
                                    pass = false;
                                    errmsg = "BTS just for AE!";
                                    //logger.info("Error!! BTS just for AE!");
                                    info = "Error!! BTS just for AE!";
                                    util.loggerInfo("",router_name,UserID,info+","+key);
                                }
                            }else if (CompID == "EZTRADE"){
                                pass = true;
                            }else{
                                pass = false;
                                errmsg = "CompID Error!";
                                //logger.info("Error!! CompID Error!");
                                info = "CompID Error!";
                                util.loggerInfo("",router_name,UserID,info+","+key);
                            } 
                        }
                    }else{
                        pass = false;
                        errmsg = json._server.errmsg;
                    }

                    if (pass){
                        //== 成功 =================================================================/  
                        req.session.signin = true;
                        req.session.user_profile = json.user_profile;

                        if (CompID == "BTS"){ // BTS for AE ---------------------
                            req.session.login_flag = true;
                            req.session.admin_flag = false; 
                            req.session.ae_flag = true;

                            //default 設定查第一個客戶                                
                            req.session.customer = ae_customer.default_cus; 
                            req.session.cus_idno = req.session.customer.idno;
                            req.session.cus_username = req.session.customer.name;

                        }else{ //Customer -------------------------------------
                            req.session.admin_flag = false;   
                            req.session.ae_flag = false;  
                            req.session.login_flag = false;
                        }

                        //logger.info("[trust.js] (" + UserID +") login_flag=" + req.session.login_flag + ",admin_flag=" + req.session.admin_flag + ",ae_flag=" + req.session.ae_flag);
                        //logger.info("[trust.js] == End == (" + UserID +") ,Trust OK! goto_url=" + goto_url);
                        info = "Trust OK! goto_url=" + goto_url + ",login_flag=" + req.session.login_flag + ",admin_flag=" + req.session.admin_flag + ",ae_flag=" + req.session.ae_flag;
                        util.loggerInfo("",router_name,UserID,info+","+key);
                        util.loggerInfo("END",router_name,UserID,key);
                        res.redirect(goto_url);   
                    }else{
                        //== 失敗 ===================================================================/          
                        //logger.info("[trust.js] == End == (" + UserID + ") Trust Fail: " + errmsg);
                        info = "Trust Fail: " + errmsg;
                        util.loggerInfo("",router_name,UserID,info+","+key);
                        util.loggerInfo("END",router_name,UserID,key);
                        req.session.signin = false;  
                        var alert_msg = "登入失敗,請重新登入! (" + errmsg + ")";
                        var recv_jd = {};                      
                        
                        recv_jd["alert_msg"] = alert_msg;
                        recv_jd["original_url"] = "";
                        var recv_json = util.getSession2Json(false,recv_jd,req.session);

                        res.render('home',recv_json);
                    }

            }catch(err){
                    logger.error("[Execption] " + err);
                    res.render('error',{"message":"Trust Error! (1)"});
                }                    
            }); 
        }).on('error', function(e) {
            logger.error(`[Execption] problem with request: ${e.message}`);
            res.render('error',{"message":"Trust Error! (2)"});
        }).end();
    }catch(err){
        res.end(util.getResponseStr('FAIL', '', {}));
        logger.error("[Execption] " + err);
        res.render('error',{"message":"Trust Error! (3)"});
    }

}); 

module.exports = router;
