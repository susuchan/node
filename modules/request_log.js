var config = require('../modules/config');
var utility = require('../modules/utility');
var uuid = require('node-uuid');

var request_log = function (req, res, next) {

    var info={};

    info.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    info.session_id = req.sessionID;
    info.request_id = uuid.v1();

    req.session.user_request_info=JSON.stringify(info);

    logger.info('<<REQ>>'+req.originalUrl+'  '+req.session.user_request_info);

    next();

}
module.exports = request_log;