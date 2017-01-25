var express = require('express');
var router = express.Router();

var http = require('http');
//var querystring = require('querystring');
var config = require('../modules/config');

var util = require('../modules/utility');

/* 客戶帳戶餘額查詢畫面 */
router.post('/qry/balance', function(req, res, next) {
    //Get Request Params
    var in_bank_info = {};
    var arr = req.body.bank_acc.split(":");

    in_bank_info["bank_cur"] = arr[0];
    in_bank_info["bank_branch"] = arr[1];
    in_bank_info["bank_acc"] = arr[2];

    req.session.in_bank_info = in_bank_info;
    next();
});

router.all('/qry/balance', function(req, res, next) {

    var header = "帳戶餘額查詢";

    var login_flag = req.session.login_flag;
    var login_id = req.session.user_profile.id;
    var login_grp = req.session.user_profile.group;

    //log
    var router_name = "bank/qry/balance";
    var key = req.session.user_request_info;
    var info = "";
    util.loggerInfo("START", router_name, login_id, key);

    var pass = false;
    var errmsg = "";

    var cus_idno = "";
    var cus_bank_acc = "";
    var cus_bank_cur = "";
    var default_bank = util.getDefaultBank(req.session);
    if (login_flag) {
        if (req.session.hasOwnProperty("customer")) {
            cus_idno = req.session.customer.idno;
            if (req.session.hasOwnProperty("in_bank_info") && req.session.in_bank_info != "") {
                cus_bank_acc = req.session.in_bank_info.bank_branch + req.session.in_bank_info.bank_acc;
                cus_bank_cur = req.session.in_bank_info.bank_cur;
            } else if (default_bank != false) {
                cus_bank_acc = default_bank.bank_branch + default_bank.bank_acc;
                cus_bank_cur = default_bank.bank_cur;
            }
        }
    } else {
        cus_idno = login_id;
        if (default_bank != false) {
            cus_bank_acc = default_bank.bank_branch + default_bank.bank_acc;
            cus_bank_acc = default_bank.bank_cur;
        }
    }

    //logger.info("[bank.js] == Start == (" + login_id + ") Group:" + login_grp + ",query cus_idno:" + cus_idno + ",cus_bank_acc:" + cus_bank_acc + ",cus_bank_cur:" + cus_bank_cur);  
    info = "Group:" + login_grp + ",query cus_idno:" + cus_idno + ",cus_bank_acc:" + cus_bank_acc + ",cus_bank_cur:" + cus_bank_cur;
    util.loggerInfo("", router_name, login_id, info + "," + key);

    //** 送出查詢前 Check ***********************************    
    if (!cus_idno) {
        errmsg = "請先輸入查詢帳號!";
    } else if (!cus_bank_acc) {
        errmsg = "銀行帳號有誤!";
    } else if (!util.checkBankAcc(cus_bank_acc, req.session)) {
        errmsg = cus_bank_acc + " 非 " + cus_idno + " 所屬帳戶不提供查詢";
    } else {
        pass = true;
    }

    if (!pass) {
        //** NOT PASS: 警告訊息 *******************************************   
        //logger.info("[bank.js] (" + login_id + ") Check Not Pass! errmsg:" + errmsg);  
        info = "Check Not Pass! errmsg:" + errmsg;
        util.loggerInfo("", router_name, login_id, info + "," + key);

        var recv_jd = {};

        recv_jd["header"] = header;
        recv_jd["original_url"] = req.originalUrl;
        recv_jd["cus_bank_acc"] = cus_bank_acc;
        if (errmsg != '') {
            var msg = util.addAlertMsg(null, 'danger', errmsg);
            recv_jd["msg"] = msg;
        }

        var recv_json = util.getSession2Json(true, recv_jd, req.session);
        res.render('bank_qry_balance', recv_json);

    } else {
        //** PASS: 送出查詢 *******************************************
        var client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        var perm = "{\"idno\":\"" + cus_idno + "\",\"bank_ac\":\"" + cus_bank_acc + "\",\"cur\":\"" + cus_bank_cur + "\",\"client_ip\":\"" + client_ip + "\"}";
        //logger.info("[bank.js] (" + login_id + ") Check Pass! request perm:" + perm); 
        util.loggerInfo("", router_name, login_id, "Check Pass! request perm:" + perm + "," + key);

        var options = {
            host: config.sbserver.host,
            port: config.sbserver.port,
            path: '/bank/GetBalance/' + perm,
            method: 'GET'
        };

        //logger.info("[bank.js] (" + login_id + ") Call Server >> path:" + options.path);   
        info = "Call Server >> path:" + options.path;
        util.loggerInfo("", router_name, login_id, info + "," + key);

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
                    var recv_jd = json;
                    var errmsg = "";
                    //logger.info("[bank.js] (" + login_id + ") ,result:"+json._server.result+",errmsg:"+json._server.errmsg);
                    info = "result:" + json._server.result + ",errmsg:" + json._server.errmsg;
                    util.loggerInfo("", router_name, login_id, info + "," + key);

                    if (json._server.result == 'OK') {
                        //** 成功 **************************************/                        
                    } else {
                        //** 查詢失敗 **************************************/
                        errmsg = "查詢失敗:" + json._server.errmsg;
                    }

                    recv_jd["header"] = header;
                    recv_jd["original_url"] = req.originalUrl;
                    recv_jd["cus_bank_acc"] = cus_bank_acc;

                    if (errmsg != '') {
                        var msg = util.addAlertMsg(null, 'danger', errmsg);
                        recv_jd["msg"] = msg;
                    }

                    var recv_json = util.getSession2Json(true, recv_jd, req.session);

                    //logger.info("[bank.js] == End == (" + login_id + ") ,errmsg=" + errmsg);    
                    info = "errmsg=" + errmsg;
                    util.loggerInfo("", router_name, login_id, info + "," + key);
                    util.loggerInfo("END", router_name, login_id, key);

                    res.render('bank_qry_balance', recv_json);

                } catch (err) {
                    logger.error("[Execption] " + err);
                    res.render('error', { "message": "Error! (1)" });
                }
            });
        }).on('error', function(e) {
            logger.error(`[Execption] problem with request: ${e.message}`);
            console.log(`problem with request: ${e.message}`);
            res.render('error', { "message": "Error! (2)" });
        }).end();
    }
});

module.exports = router;