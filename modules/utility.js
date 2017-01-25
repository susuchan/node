var crypto = require('crypto');

module.exports = {

    // { "_server":{ "result":"OK|FAIL", "errmsg":"..." }, "field1":"...", "field2":"...", "field3":"..." ... }

    getResponseStr : function(result,errmsg,res_data){
        var json = {};    
        json.result=result;
        json.errmsg=errmsg;
        res_data._server=json;
        return JSON.stringify(res_data);
    },

    getMD5 : function(str){
        var md5sum = crypto.createHash('md5');
        md5sum.update(str);
        str = md5sum.digest('hex');
        return str;
    },

    //** -------------------------------------------
    //* 取得 AE Customer 清單
    //* user_profile: req.session.user_profile
    //* 原則: 1.先檢查 hierarchy , 若有則為營業員, 根據 role 及 belong_unit 判斷要抓的 cutomer 清單
    //*       2.若沒有 hierarch , 表示非營業員, 為理專或介紹人, 則直接抓 rm_ref_customer 清單
    //* -------------------------------------------- 
    getAECustomer : function(user_profile){
        var staff_no = user_profile.id;
        var ae_customer = {};  all_cus = [];   default_cus = {};
        var cus_cnt = 0;
        if (user_profile.hasOwnProperty("hierarchy") && Object.keys(user_profile.hierarchy).length > 0){ 
            //營業員 -----------------------------
            //依 role 及 belong_unit 判斷要抓的 cutomer
            var role = user_profile.role;
            var belong_unit = user_profile.belong_unit;            
            if (role == "officer"){
                for(var unit in user_profile.hierarchy){
                    var unit_customer = user_profile.hierarchy[unit];
                    for(var key in unit_customer){
                        if (unit_customer[key].hasOwnProperty("customer")){ 
                            cus_cnt += unit_customer[key].customer.length;
                            //依營業員放入
                            //all_cus[key] = unit_customer[key];
                            //打散放入
                            for(var i =0; i < unit_customer[key].customer.length; i++){
                                all_cus.push(unit_customer[key].customer[i]);
                            }
                        }
                    }
                }
            }else if (role == "boss"){
                var unit_customer = user_profile.hierarchy[belong_unit];
                for(var key in unit_customer){
                    if (unit_customer[key].hasOwnProperty("customer")){
                        cus_cnt += unit_customer[key].customer.length;
                        //依營業員放入
                        //all_cus[key] = unit_customer[key].customer;
                        //打散放入
                        for(var i =0; i < unit_customer[key].customer.length; i++){
                            all_cus.push(unit_customer[key].customer[i]);
                        }
                    }
                }
            }else{ // sales
                if (user_profile.hierarchy[belong_unit].hasOwnProperty(staff_no)){
                    cus_cnt = user_profile.hierarchy[belong_unit][staff_no].customer.length;
                    all_cus = user_profile.hierarchy[belong_unit][staff_no].customer;
                }
            }
        //理專 OR 介紹人 --------------------    
        } else if (user_profile.hasOwnProperty("rm_ref_customer") && user_profile.rm_ref_customer.length > 0){  
            cus_cnt = user_profile.rm_ref_customer.length;
            all_cus = user_profile.rm_ref_customer;
        }else{
            ae_customer = {};
        }
        
        //設定 default cus
        if (cus_cnt > 0){  
            default_cus= all_cus[0];   
            all_cus = this.sortByValue(all_cus,"idno",true);
        }
        ae_customer["cus_cnt"] = cus_cnt;
        ae_customer["default_cus"] = default_cus;
        ae_customer["customer"] = all_cus;
        return ae_customer;
    },

    //** -------------------------------------------
    //* 把 session 值轉成 json 格式, 傳到前端頁面
    //* layout: 套用 layout , false: 不套用, true: 套用 default, 或設定其他套用 layout 頁面
    //* recv: 要回傳到前端頁面的 json
    //* session: req.session
    //* -------------------------------------------- 
    getSession2Json : function(layout,recv,session){
        var json = recv;

        if (!layout){
            json["layout"] = layout;
        }
        //Page setting
        json["signin"] = session.signin;  
        json["login_flag"] = session.login_flag;
        json["admin_flag"] = session.admin_flag;
        json["ae_flag"] = session.ae_flag;

        //Login id info
        json["login_id"] = session.user_profile.id;
        json["username"] = session.user_profile.name;  
        var cus_acc = (session.user_profile.cus_acc == undefined) ? "" : session.user_profile.cus_acc;
        var broker = (session.user_profile.broker == undefined) ? "" : session.user_profile.broker;
        var open_belong = (session.user_profile.open_belong == undefined) ? "" : session.user_profile.open_belong;
        if (broker=="9A95") broker = open_belong;
        var show_cus_acc = "";
        if (cus_acc!=""){
            show_cus_acc = (broker!="") ? "(" + broker + "-" + cus_acc + ")" : "(" + cus_acc + ")";
        }else{
            show_cus_acc = (broker!="") ?  "(" + broker + ")" : "";
        }
        json["cus_acc"] = show_cus_acc;
        json["nowtime"] = this.getDateTime();

        //Admin Parameter setting
        if ( session.isAdminGrp(session.user_profile.group) || (session.isGrp('AE')) ){

            if (session.hasOwnProperty("customer")){
                //Customer bank info
                var cus_bank_info = {};
                var idx = 0;
                if ((session.customer.hasOwnProperty("txn_bank")) && (session.customer.txn_bank == "807") && (session.customer.txn_acc != "99999999999") && (session.customer.txn_acc.trim() != "")) {
                    cus_bank_info[idx] = {'bank_no': session.customer.txn_bank, 'bank_branch' : session.customer.txn_branch, 'bank_acc' : session.customer.txn_acc , 'bank_cur' : "***"};
                    idx++;
                }
                if ((session.customer.hasOwnProperty("own_bank")) && (session.customer.own_bank == "807") && (session.customer.own_acc != "99999999999") && (session.customer.own_acc.trim() != "")) {
                    cus_bank_info[idx] = {'bank_no': session.customer.own_bank, 'bank_branch' : session.customer.own_branch, 'bank_acc' : session.customer.own_acc, 'bank_cur' : "***"};
                    idx++;
                }
                if ((session.customer.hasOwnProperty("own_bank_tw")) && (session.customer.own_bank_tw == "807") && (session.customer.own_acc_tw != "99999999999") && (session.customer.own_acc_tw.trim() != "")) {    
                    cus_bank_info[idx] = {'bank_no': session.customer.own_bank_tw, 'bank_branch' : session.customer.own_branch_tw, 'bank_acc' : session.customer.own_acc_tw, 'bank_cur' : "NTD"};
                    idx++;
                }
                json["cus_bank_info"] = cus_bank_info;

                if (session.isGrp('AE')){ 
                    if (!json.hasOwnProperty("ae_customer")) { 
                        json["ae_customer"] = this.getAECustomer(session.user_profile);
                    }
                }
                json["cus_idno"] = session.customer.idno;  
                json["cus_username"] = session.customer.name;
                json["cus_cus_acc"] = session.customer.cus_acc;
                var cus_broker =session.customer.broker;
                if (cus_broker=="9A95") cus_broker = session.customer.open_belong;
                json["cus_broker"] = cus_broker;
            }

            //Check Customer idno
            json["check_cus"] = this.checkCus(session);

        }

        return json;
    },
    getDateTime : function() {

        var date = new Date();
        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min  = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec  = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day  = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + sec;
    },

    //** -------------------------------------------
    //* 檢查是否有設定客戶 idno , 用餘前端顯示客戶名稱, 或提醒管理者要先輸入客戶id
    //* -------------------------------------------- 
    checkCus : function (session){
        try{
            if (!session.hasOwnProperty('cus_idno') || session.cus_idno=="")
                return false;
            else
                return true;
        }catch(err){
            return false;
        }
    },

    //** -------------------------------------------
    //* 檢查是否為客戶銀行帳號
    //* -------------------------------------------- 
    checkBankAcc : function (bank_acc,session){
       try {
           var customer = session.user_profile;
           if (!session.isGrp('CLIENT')){
               customer = session.customer;
           }
           var txn = (customer.hasOwnProperty("txn_acc")) ? customer.txn_branch + customer.txn_acc : "";
           var own = (customer.hasOwnProperty("own_acc")) ? customer.own_branch + customer.own_acc : "";
           var own_tw = (customer.hasOwnProperty("own_acc_tw")) ? customer.own_branch_tw + customer.own_acc_tw : "";
          
           if (bank_acc == txn)
                return true;
           else if (bank_acc == own)
                return true;
           else if (bank_acc == own_tw)
                return true; 
           else
                return false;
        }catch(err){
            return false;
        }
    },

    //** -------------------------------------------
    //* 取得客戶 default bank acc 資訊
    //* -------------------------------------------- 
    getDefaultBank : function (session){
       var json = {};
       try {
           var customer = session.user_profile;
           if (!session.isGrp('CLIENT')){
               customer = session.customer;
           }

           var txn = (customer.hasOwnProperty("txn_bank")) ? customer.txn_bank : "";
           var own = (customer.hasOwnProperty("own_bank")) ? customer.own_bank : "";
           var own_tw = (customer.hasOwnProperty("own_bank_tw")) ? customer.own_bank_tw : "";
           if ((txn.substring(0, 3) == "807") && (customer.txn_acc != "99999999999") && (customer.txn_acc.trim() != "")){
                json["bank_no"] = txn;
                json["bank_branch"] = customer.txn_branch;
                json["bank_acc"] = customer.txn_acc;
                json["bank_cur"] = "***";
           }else if ((own.substring(0, 3) == "807") && (customer.own_acc != "99999999999") && (customer.own_acc.trim() != "")){
                json["bank_no"] = own;
                json["bank_branch"] = customer.own_branch;
                json["bank_acc"] = customer.own_acc;
                json["bank_cur"] = "***";
           }else if ((own_tw.substring(0, 3) == "807") && (customer.own_acc_tw != "99999999999") && (customer.own_acc_tw.trim() != "")){
                json["bank_no"] = own_tw;
                json["bank_branch"] = customer.own_branch_tw;
                json["bank_acc"] = customer.own_acc_tw;
                json["bank_cur"] = "NTD";
           }else{
                return false;
           }            

           return json;
        }catch(err){
            return false;
        }
    },    

    //** -------------------------------------------
    //* json data sort by value
    //* prop name : json property name (string)
    //* acs : true (sort by acs) / false (sort by desc)
    //* -------------------------------------------- 
    sortByValue : function(jd,prop, asc) {
        var json = jd;
        json = json.sort(function(a, b) {
            if (asc) {
                return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
            } else {
                return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
            }
        });
        return json;
    },

    //** -------------------------------------------
    //* 寫入 logger
    //* type : START / END
    //* router_name
    //* login_id
    //* info
    //* -------------------------------------------- 
    loggerInfo: function(type,router_name, login_id, info) {
        var logdata = ""
        if (type == "START"){
            logdata = '===== START [' + router_name + '] (' + login_id +') ====='
        }else if (type == "END"){
            logdata = '===== END [' + router_name + '] (' + login_id + ') =====';
        }else{
            logdata = '     [' + router_name + '] (' + login_id + ') '+ info;
        }
        logger.info(logdata);
    },  

    /** ---------------------------------------------------------
     *  加入系統回饋訊息資訊 (將訊息加入msgObj,使用msgObj傳給前端顯示)
     *  msgObj : 回饋訊息Obj.
     *  msgType : 訊息類別 ('success', 'info', 'warning', 'danger'), default : 'info'
     * ----------------------------------------------------------*/
    addAlertMsg: function(msgObj, msgType, text) {
        /* SAMPLE
        var msgObj = {
            success : ['success1','success2'],
            info : ['info1','info2'],
            warning : ['warning1', 'warning2'],
            danger : ['error1','error2']
        };
        */
        if (null == msgObj) { // JSON初始化
            msgObj = {
                success: [],
                info: [],
                warning: [],
                danger: []
            };

        }
        if (null == msgType || ['success', 'info', 'warning', 'danger'].indexOf(msgType) == -1) {
            msgType = 'info'; // default 歸類為info
        }
        if ('success' == msgType) {
            msgObj.success.push(text);
        } else if ('info' == msgType) {
            msgObj.info.push(text);
        } else if ('warning' == msgType) {
            msgObj.warning.push(text);
        } else if ('danger' == msgType) {
            msgObj.danger.push(text);
        }
        return msgObj;
    }, // addAlertMsg End

}