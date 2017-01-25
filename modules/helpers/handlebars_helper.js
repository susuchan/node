
var register = function(Handlebars) {

    var helpers = {
        //判斷是否大於 0
        ifGtZero: function (num,options){
          if(num>0) 
            return options.fn(this);
          else  
            return options.inverse(this);  
        },
        
        //log
        log_info: function(message) {
            var log4js = require('../modules/log4js');
            var log=log4js('sbservice.log');
            log.info(message);
            console.log(message);
        },

        //money format to: NNN,NNN.DD
        format_money: function(number,digits,options) {
            var num = Number(number);
            var rtn = "";
            if (options == undefined){  digits = 0;  }
            if (!Number.isInteger(digits)){ return number;}
            if (digits == 0)
                rtn += num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
            else
                rtn += num.toFixed(digits).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');

            return rtn;
        },

        //date format
        format_date: function(date,options){    
            var fdate = date;
            if (date.length == 8) {
                fdate = date.substr(0, 4) + "/" + date.substr(4, 2) + "/" + date.substr(6, 2);
            }else if(date.length == 14){
                fdate = date.substr(0, 4) + "/" + date.substr(4, 2) + "/" + date.substr(6, 2) + " " + date.substr(8, 2) + ":" + date.substr(10, 2) + ":" + date.substr(12, 2);
            }
            return fdate;
        },


    };

    if (Handlebars && typeof Handlebars.registerHelper === "function") {
        // register helpers
        for (var prop in helpers) {
            Handlebars.registerHelper(prop, helpers[prop]);
        }
    } else {
        // just return helpers object if we can't register helpers here
        return helpers;
    }

};

module.exports.register = register;
module.exports.helpers = register(null);
