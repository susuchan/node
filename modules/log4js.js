var log4js = function(filename){
	
	var _log4js = require('log4js');
	_log4js.configure({
		appenders: [
			//{ type: 'console' }, //控制台输出
			/*{
			type: 'file', //文件输出
			filename: '../log/'+filename, 
			maxLogSize: 1024,
			backups:3,
			category: filename
			},*/
			{
				"type": "dateFile",
				"filename": "../log/" + filename,
				"maxLogSize": 1024,
				"pattern": ".yyyyMMdd",
				"category": filename,
				layout: {
					type: 'pattern',
					pattern: "%d{yyyy/MM/dd hh:mm:ss.SSS} %p [%x{ln}] - %m%n",
					tokens: {
						ln : function() {
							var _stack=(new Error).stack.split("\n");							
							return _stack[_stack.length-1].trim();
						}
					}
				}
			}
		]
	});
	var log = _log4js.getLogger(filename);
	log.setLevel('INFO');

    return log;
}

module.exports = log4js;