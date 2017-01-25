module.exports = {
    defaultLayout: 'layout',
    extname: '.hbs',    
    helpers: {

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
            var log=log4js('sbweb.log');
            log.info(message);
            console.log(message);
        },

        //money format to: NNN,NNN.DD
        format_money: function(number,digits,options) {
            var num = Number(number);
            var rtn = "";
            if (options == undefined){  digits = 0;  }
            if (!Number.isInteger(digits)){ return number;}
            if (digits == 0){
                rtn += num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
            }else{
                rtn += num.toFixed(digits).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');  
            }
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

        //加工 ROI 加底色顯示正/負
        format_ROI: function(number,digits,base,options){
            var num = Number(number);
            var rtn_num = '';
            var html = '';
            if (options == undefined){  digits = 0;  }
            if (!Number.isInteger(digits)){ return number;}
            if (digits == 0){
                rtn_num += num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
            }else{
                rtn_num += num.toFixed(digits).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');  
            }
            if(num > base) 
                html = '<span class="label label-danger">' + rtn_num + ' %</span>';
            else if (num <base)
                html = '<span class="label label-success">' + rtn_num + ' %</span>';
            else
                html = '<span>' + rtn_num + ' %</span>';
            return html;            
        },


        /* 顯示回饋訊息資訊 */
        showMsg: function(msg, options) {
            // type : success, info, warning, danger
            /* TEST
            var msg = {
                success: ['success1', 'success2'],
                info: ['info1', 'info2'],
                warning: ['warning1', 'warning2'],
                danger: ['error1', 'error2']
            };
            */
            var html = '';
            if (msg) {
                // success
                if (msg.success && msg.success.length > 0) {
                    html = html + '<div class="alert alert-success alert-dismissable">' +
                        '       <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
                    for (var m = 0; m < msg.success.length; m++) {
                        html = html + msg.success[m];
                        if (m < msg.success.length - 1) { html = html + '<br/>'; }
                    }
                    html = html + '</div>';
                }
                // info
                if (msg.info && msg.info.length > 0) {
                    html = html + '<div class="alert alert-info alert-dismissable">' +
                        '       <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
                    for (var m = 0; m < msg.info.length; m++) {
                        html = html + msg.info[m];
                        if (m < msg.info.length - 1) { html = html + '<br/>'; }
                    }
                    html = html + '</div>';
                }
                // warning
                if (msg.warning && msg.warning.length > 0) {
                    html = html + '<div class="alert alert-warning alert-dismissable">' +
                        '       <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
                    for (var m = 0; m < msg.warning.length; m++) {
                        html = html + msg.warning[m];
                        if (m < msg.warning.length - 1) { html = html + '<br/>'; }
                    }
                    html = html + '</div>';
                }
                // danger
                if (msg.danger && msg.danger.length > 0) {
                    html = html + '<div class="alert alert-danger alert-dismissable">' +
                        '       <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
                    for (var m = 0; m < msg.danger.length; m++) {
                        html = html + msg.danger[m];
                        if (m < msg.danger.length - 1) { html = html + '<br/>'; }
                    }
                    html = html + '</div>';
                }
            }
            return html;

        },
        /* 顯示回饋訊息資訊 End */


    }
}
