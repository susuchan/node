// Default Config
var config = {

	ae_router: true,

	maintenance:{
		enable: false,
		info: '系統維護中, 預計開放日期 2017/1/3 , 造成不便請見諒 。'
	},

	sbserver : {
		host: '211.76.149.25', // UAT
		port: 3001
	},

	//----------------------------------------------------------------
	session_store : 'redis', // redis or mongodb or "" for native
	redis : {
		host:'127.0.0.1',
		port:6379,
		expires: 60 * 60 * 1000
		},
	mongodb : {
		url:'mongodb://localhost/sbweb',
		expires: 60 * 60 * 1000
		},
	//----------------------------------------------------------------
	
	eztrade_otp : {
		host:'https://eztrade.sinopac.com.tw',
		port:443,
		path:'/scripts/cgirpc32.dll/cgicmop'
	}
};

////////////////////////
// Customize
////////////////////////
var os=require('os');
var host=os.hostname();
/////////////////////////////////////////////////////////////
// for Developer's PC
if( host=='TK19F006124C' || host=='TK19F009685A' ){

	// connect to localhost sbserver
	config.sbserver.host = '127.0.0.1';
	//config.sbserver.host = '211.76.149.25';
	
	//session_store = '';
	config.redis.host = '211.76.149.25'; // UAT
}

/////////////////////////////////////////////////////////////
// for UAT
if( host=='vmtest04' ){

	config.sbserver.host='127.0.0.1';
}

/////////////////////////////////////////////////////////////
// for wmweb1, wmweb2
if( host=='WMWEB1' || host=='WMWEB2' ){

	config.ae_router = false;
	config.maintenance.enable = false;
	config.sbserver.host='128.110.13.51';
}

/////////////////////////////////////////////////////////////
// for wmap2
if( host=='wmap2'){
	config.sbserver.host='128.110.13.51';
	config.maintenance.enable = false;
}

module.exports = config;