var skip_auth_urls = '/,/trust,/login,/logout,/AE';
var admin_grp = "IT,TRADE,SETTLE";
var config = require('../modules/config');
var util = require('../modules/utility');

var auth = function (req, res, next) {

    var client_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (config.maintenance.enable){
        var recv_jd = {};
        recv_jd["layout"] = false;
        recv_jd["maintenance_msg"] = config.maintenance.info;                            
        res.render('maintenance',recv_jd);
        return false;
    }

    //////////////////////////////////////
    //** 檢查是否為 AdminGroup (group=IT,TRADE,SETTLE)
    req.session.isAdminGrp = function(group){
        if (admin_grp.indexOf(group) > -1){
            return true;
        }else {  return false;  }
    };

    //** 檢查 Group
    req.session.isGrp = function(group) {
        try{ 
            if(req.session.user_profile.group && req.session.user_profile.group.indexOf(group) > -1)
                return true;
            else
                return false;
        }catch(err){
            return false;
        }
    };
    //////////////////////////////////////

      
    // 檢查session中 user_profile 是否存在
    if(!req.session.hasOwnProperty('user_profile')){
        // 若不存在，代表User未登入，建立一個空的 user_profile
        req.session.user_profile = {"permission":''};
        req.session.signin = false; 
    }

    // 建立捷徑變數
    var perm=req.session.user_profile.permission; // user session中權限物件
    var _url=req.url.split('?')[0]; // 此次Request之URL

    // (((LEVEL 1))) 首先判斷 userId 是否有值，若為空值，代表尚未登入
    if(!perm.hasOwnProperty('userId') || perm.userId == ''){ //##############################################
        
        // 若Request URL在不檢查權限清單中，PASS !
        if(skip_auth_urls.indexOf(_url) > -1){ //------
            
            next();

        } else { //------------------------------------
            
            // 未登入，需權限使用之頁面，轉至錯誤說明頁
            //res.render('error',{"message":"未登入","error":{"status":"error","alertMsg":true}});
            var recv_jd = {};
            recv_jd["layout"] = false;
            recv_jd["alert_msg"] = "請先登入!";
            recv_jd["signin"] = req.session.signin;      
            recv_jd["login_flag"] = req.session.login_flag;
            recv_jd["admin_flag"] = req.session.admin_flag;
            recv_jd["ae_flag"] = req.session.ae_flag;                                 
            res.render('home',recv_jd);

        } //-------------------------------------------

    // (((LEVEL 1))) 已有登入
    } else { //###########################################################    

        // 若Request URL在不檢查權限清單中，PASS !
        if(skip_auth_urls.indexOf(_url) > -1){ //------            
            next();
        }

        // 如果User權限表中有 Request url 項目，代表有權限使用
        else if(perm.hasOwnProperty(_url)){ //------------------
            
            //////////////////////////////////////
            // 定義函式
            req.session.canDo = function(action) {
                actPerm=perm[_url];
                // 若註記星號, 代表全部action pass
                if(actPerm == '*'){
                    return true;
                }else{
                    // 檢查特定 action
                    if(actPerm.indexOf(action)>-1) 
                        return true;
                    else
                        return false;
                }
            };
            next();
        
        // url不在User權限表中，轉至錯誤說明
        } else { //---------------------------------------
            var recv_jd = {};
            recv_jd["layout"] = false;
            recv_jd["alert_msg"] = "無使用權限!";   

            var recv_json = util.getSession2Json(false,recv_jd,req.session);
            res.render('home',recv_json);

        } //----------------------------------------------

    } //##################################################################
}
module.exports = auth;

/*
{
    "user_profile":{
        "role":"staff",
        "id":"000035",
        "permission":{
            "UserId":"000035",
            "/":"*",
            "/bond/qry/inv":"*"
        },
        "hierarchy":{
            "division":"0311",
            "group":"47",
            "officer":{"staff_no":"000035","role":"0010","name":"吳時欣"},
            "boss":{"staff_no":"008411","role":"5005","name":"趙啟承"},

            "000035":{"staff_no":"000035","role":"0010","name":"吳時欣","customer":[
                {"idno":"A000000001","branch":"9A89","account":"00000001","name":"David","sales":"000035"}
                ]},
            
            "000308":{"staff_no":"000308","role":"5000","name":"潘秀娟","customer":[]},
            "000939":{"staff_no":"000939","role":"5000","name":"王冠文","customer":[]},

            "005033":{"staff_no":"005033","role":"5000","name":"陳莉玲","customer":[
                {"idno":"A000000004","branch":"9A89","account":"00000004","name":"John","sales":"005033"},
                {"idno":"A000000005","branch":"9A89","account":"00000005","name":"John","sales":"005033"},
                {"idno":"A000000006","branch":"9A89","account":"00000006","name":"John","sales":"005033"}
                ]},

            "005272":{"staff_no":"005272","role":"5000","name":"蔣天民","customer":[
                {"idno":"A000000007","branch":"9A89","account":"00000007","name":"John","sales":"005272"},
                {"idno":"A000000008","branch":"9A89","account":"00000008","name":"John","sales":"005272"}
                ]},

            "006861":{"staff_no":"006861","role":"5000","name":"張美芳","customer":[]},
            "008411":{"staff_no":"008411","role":"5005","name":"趙啟承","customer":[]},
            
            "009162":{"staff_no":"009162","role":"5000","name":"黃義銘","customer":[
                {"idno":"A000000009","branch":"9A89","account":"00000009","name":"John","sales":"009162"},
                {"idno":"A000000010","branch":"9A89","account":"00000010","name":"John","sales":"009162"}
                ]}
        }
    },
    "_server":{"result":"OK","errmsg":""}
}
*/