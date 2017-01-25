var http = require('http');
var querystring = require('querystring');
var config = require('../modules/config');

//var log4js = require('./log4js');
//var log=log4js('sbservice.log');

module.exports = {

    GetBondInventory : function(res,account){
        try{            		
            //log.info('ACCOUNT> '+account);

            var options = {
                host: config.sbserver.host,
                port: config.sbserver.port,
                path: '/bond/GetBondInventory/'+account,
                method: 'GET'
            };
        }catch(err){
            //log.error(err);
        }

        http.request(options, function(response) {
            var recv = '';

            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                recv += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                try{                
                    console.log('>>>>>>>>>   '+recv);
                    res.render('index',JSON.parse(recv));
                }catch(err){
                    //log.error(err);
                }
            });
        }).on('error', function (e) {
            //log.error(`problem with request: ${e.message}`);
            console.log(`problem with request: ${e.message}`);
        }).end();
    }

}