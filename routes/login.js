var express = require('express');
var router = express.Router();
var http = require('http');
var querystring = require('querystring');
var config = require('../modules/config');

var util = require("../modules/utility");

/* Check Login id & password */
router.post('/', function(req, res, next) {
   
    req.session.signin = false;

    //Get Request Params
    var in_login_flag = req.body.login_flag;
    var in_idno = req.body.idno;
    var in_password = req.body.password;
    var login_flag = false;
    var alert_msg = "";
    var original_url = "/";

    //logger.info("[login.js] == Start == (" + in_idno +")");
    var router_name = "login";
    var key = req.session.user_request_info;
    var info = "";
    util.loggerInfo("START",router_name,in_idno,key);

    try {
        var para={};        
        var login_path = "";
        var path_for_log = "";

        //判斷是否AE   
        if (in_login_flag=="AE"){   login_flag = true;   }

        if (login_flag){
            para.staff_no=in_idno;
            path_for_log = '/ad/'+JSON.stringify(para);
            para.pwd=in_password;
            login_path = '/ad/'+JSON.stringify(para);            
            req.session.login_flag = true;
        }else{
            para.idno=in_idno;
            path_for_log = '/sso/login/'+JSON.stringify(para);
            para.pwd=in_password;
            para.client_ip=req.connection.remoteAddress
            login_path = '/sso/login/'+JSON.stringify(para);
            req.session.login_flag = false;
        }

        var options = {
            host: config.sbserver.host,
            port: config.sbserver.port,
            path: login_path,
            method: 'GET'
        };

        //logger.info("[login.js] (" + in_idno + ") Call Server >> path:"+ path_for_log);
        info = "Call Server >> path:"+ path_for_log;
        util.loggerInfo("",router_name,in_idno,info+","+key);

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
                    var recv_jd = {};

                    //logger.info("[login.js] (" + in_idno + ") ,result:"+json._server.result+",errmsg:"+json._server.errmsg);
                    info = "result:"+json._server.result+",errmsg:"+json._server.errmsg;
                    util.loggerInfo("",router_name,in_idno,info+","+key);

                    if(json._server.result=='OK'){  
                        /** 登入成功 **************************************/
                        req.session.signin = true;
                        req.session.user_profile = json.user_profile; 

                        if (login_flag){
                            var staff_no = json.user_profile.id;
                            var login_action = json.user_profile.login_action;  
                            var ae_customer = []; 

                            //Group Filter
                            //logger.info("[login.js] (" + in_idno + ") Group:"+json.user_profile.group);
                            info = "Group:"+json.user_profile.group;
                            util.loggerInfo("",router_name,in_idno,info+","+key);

                            var check_grp = json.user_profile.group;
                            if (req.session.isAdminGrp(check_grp)){   
                                req.session.login_flag = true;                             
                                req.session.admin_flag = true;   
                                req.session.ae_flag = false; 
                                req.session.customer = {};                                                         
                            } else if (req.session.isGrp('AE')){  
                                req.session.login_flag = true;
                                req.session.admin_flag = false; 
                                req.session.ae_flag = true;  

                                //2017.01.11 取得所屬客戶
                                ae_customer = util.getAECustomer(req.session.user_profile);
                                info = "role:"+ req.session.user_profile.role + ",belong_unit:"+ req.session.user_profile.belong_unit + ",customer.length:"+ ae_customer.cus_cnt;
                                util.loggerInfo("",router_name,in_idno,info+","+key);

                                if (ae_customer.cus_cnt>0 && ae_customer.default_cus.hasOwnProperty("idno")){
                                    //default 設定查第一個客戶                                
                                    req.session.customer = ae_customer.default_cus; 
                                    req.session.cus_idno = req.session.customer.idno;
                                }else{
                                    req.session.signin = false;                         
                                    alert_msg = "登入失敗,請重新登入! (查無任何所屬客戶!)";
                                }
                            }else{
                                req.session.login_flag = false;
                            }

                            //logger.info("[login.js] (" + in_idno + ") login_flag=" + req.session.login_flag + ",admin_flag=" + req.session.admin_flag + ",ae_flag=" + req.session.ae_flag);
                            info = "login_flag=" + req.session.login_flag + ",admin_flag=" + req.session.admin_flag + ",ae_flag=" + req.session.ae_flag;
                            util.loggerInfo("",router_name,in_idno,info+","+key);

                            recv_jd["ae_customer"] = ae_customer;
                            original_url = "/AE";
                        }else{
                            req.session.username = json.user_profile.name;
                            original_url = "/";
                        }   


                    }else{   
                        /** 登入失敗 **************************************/
                        req.session.signin = false;                         
                        alert_msg = "登入失敗,請重新登入!";
                    }  

                    recv_jd["alert_msg"] = alert_msg;
                    recv_jd["original_url"] = original_url;

                    var recv_json = util.getSession2Json(false,recv_jd,req.session);

                    //logger.info("[login.js] == End == (" + in_idno +")");
                    util.loggerInfo("END",router_name,in_idno,info+","+key);
                    res.render('home',recv_json);

                }catch(err){
                    logger.error("[Execption] " + err);
                    res.render('error',{"message":"Login Error! (1)"});
                }

            });
        }).on('error', function (e) {
            logger.error(`[Execption] problem with request: ${e.message}`);
            res.render('error',{"message":"Login Error! (2)"});
            
        }).end();

    }catch(err){
        logger.error("[Execption] " + err);
        res.render('error',{"message":"Login Error! (3)"});
    }
});


module.exports = router;