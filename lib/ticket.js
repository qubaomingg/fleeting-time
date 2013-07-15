var env = require('./setting');
var fs = require('fs');
var path = require('path');

EXPIRES = 86390;
TICKETCACHE = '.ticketcache';

ticketCache = {};

var ticketPath = path.join(env.get('workspace'), TICKETCACHE);

ticket = {
	set:function(t, user, timestamp){
		ticketCache.t = t;
		ticketCache.user = user;
		ticketCache.timestamp = timestamp || new Date().getTime();

		var tc = JSON.stringify(ticketCache);

		if(env.get('remember_ticket')){
			try{
				fs.writeFileSync(ticketPath, tc);
			}catch(ex){}
		}
	},

	get:function(){
		var ts = new Date().getTime();

		if(!ticketCache.t || (ts - ticketCache.t > EXPIRES)){
			ticket.destory();
			return {};
		}

		return ticketCache;
	},

	destory:function(){
		ticketCache = {};
		try{
			fs.writeFileSync(ticketPath, '');
		}catch(ex){}
	}
}

if(env.get('remember_ticket')){
	try{
		var tc = fs.readFileSync(ticketPath, "utf8");
		tc = JSON.parse(tc);
		ticket.set(tc.t, tc.user, tc.timestamp);
	}catch(e){
		ticket.destory();
	}
}

module.exports = ticket;
