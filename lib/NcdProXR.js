const events = require("events");
const Queue = require("promise-queue");
module.exports = class NcdSerialProXR{
	constructor(connection){
		this.interactive = {};
		this.comm = connection;
		this.buff = [];
		this.queue = new Queue(1);
		this.tout = false;
		this.queueCBs = {fulfill: false, reject: false};
		var obj = this;
		this.comm.on('data', function(d){
			if(obj.queueCBs.fulfill){
				obj.buff.push(d);
				var valid = obj.validate();
				if(valid === true){
					var fulfill = obj.queueCBs.fulfill;
					obj.queueCBs = {fulfill: false, reject: false};
					var payload = obj.buff.slice(2, -1);
					obj.buff = [];
					clearTimeout(obj.tout);
					fulfill(payload);
				}else if(valid !== false){
					obj.buff = [];
					var reject = obj.queueCBs.reject;
					obj.queueCBs = {fulfill: false, reject: false};
					clearTimeout(obj.tout);
					reject({'Communication Error': valid});
				}
			}
		});
		this.comm.on('error', (err) => {
			var reject = obj.queueCBs.reject;
			obj.queueCBs = {fulfill: false, reject: false};
			reject({'Communication error': err});
		});
	}
	init(){
		return this.send([254,33]);
	}
	validate(){
		if(this.buff.length){
			var len = this.buff.length;
			if(this.buff[0] == 170){
				if(len > 3 && this.buff[1]+3 == len){
					var valid = this.buff[len-1] == ((this.buff.reduce((t,i) => t+i) - this.buff[len-1]) & 255);
					if(!valid){
						return this.buff;
					}
					return true;
				}
			}else{
				return 'bad header';
			}
		}
		return false;
	}
	wrapApi(payload){
		var packet = [170, payload.length];
		packet.push.apply(packet, payload);
		packet.push(packet.reduce((t,i) => t+i)&255);
		return Buffer.from(packet);
	}
	send(payload){
		var obj = this;
		var cmd = this.queue.add(() => {
			return new Promise((fulfill, reject) => {
				obj.queueCBs.reject = reject;
				obj.queueCBs.fulfill = fulfill;
				obj.tout = setTimeout(() => {
					obj.buff = [];
					obj.queueCBs = {fulfill: false, reject: false};
					//TODO: we need a way to not do this until after the connection is available
					reject({'Communication Error': 'Timeout'});
				}, 3000);
				var bytes = obj.wrapApi(payload);
				obj.comm.write(bytes);
			});
		});
		return new Promise((fulfill, reject) => {
			cmd.then((res) => {
				fulfill(res);
			}).catch(reject);
		});
	}
	relayStatus(r, b){
		if(r > 8){
			_r = r % 8;
			b = (r - _r) / 8;
			r = _r;
		}
		if(typeof b == 'undefined') b = 1;
		return this.send([254, r+115, b]);
	}
	bankStatus(b){
		return this.send([254,124,b]);
	}
	_relayOp(o,r){
		var cmd = [254];
		switch(o){
			case 'toggle':
				cmd.push(47);
				cmd.push(r & 255);
				cmd.push(r >> 8);
				cmd.push(1);
				break;
			case 'on':
				cmd.push(48);
				cmd.push(r & 255);
				cmd.push(r >> 8);
				break;
			case 'off':
				cmd.push(47);
				cmd.push(r & 255);
				cmd.push(r >> 8);
				break;
		}
		return this.send(cmd);
	}
	relayOp(o,r,b){
		if(o == 'invert') o='toggle';
		if(typeof b == 'undefined'){
			return this._relayOp(o,parseInt(r)-1);
		}else if(parseInt(b) == 0){
		}else{
			return this._relayOp(o,(8 * (parseInt(b)-1)) + (parseInt(r)-1));
		}
	}
	bankOp(op, b, g){
		if(g == 'all'){
			var cmd = 0;
			switch(op){
				case 'reverse':
					cmd+=1;
				case 'invert':
					cmd+=1;
				case 'on':
					cmd+=1;
				case 'off':
					cmd+=129;
			}
			return this.send([254,cmd,b]);
		}
		var val;
		var o = op == 'on' ? 1 : 0;
		switch(g){
			case 'odd':
				val = 85;
				break;
			case 'even':
				val = 170;
				break;
			default:
				if(!isNaN(g)){
					val = 100 + (g-1) + (op == 'on' ? 8 : 0);
					return this.send([254,val,parseInt(b)])
				}
		}
		return this.send([254,140,val,parseInt(b)])
	}
	findTimer(r){
		var promises = [];
		for(var t=0;t<16;t++){
			promises.push(this.send([254, 50, 130, t]));
		}
		return new Promise((fulfill, reject) => {
			Promise.all(promises).then((r) => {
				var found = r.some((status, t) => {
					if(status[3] == r || status.slice(0,3).reduce((a,b) => a+b) == 0){
						fulfill(t);
						return true;
					}
				});
				if(!found) reject(false);
			}).catch(reject)
		});
	}
	timerOp(op, r, d){
		var obj = this;
		return new Promise((fulfill, reject) => {
			obj.findTimer(r).then((t) => {
				if(op == 'in') t+=20;
				obj.send([254,50,t+50,d.h,d.m,d.s,r]).then(fulfill).catch(reject);
			}).catch(reject);
		});
	}
	command(cmd){
		var seconds = 0;
		if(cmd.duration){
			cmd.relay = parseInt(cmd.relay)-1;
			if(typeof cmd.bank != 'undefined'){
				cmd.relay += ((cmd.bank-1) * 8);
			}
			if(typeof cmd.duration != 'object'){
				var duration = parseInt(cmd.duration);
				cmd.duration = {
					h: 0,
					m: 0,
					s: 0,
				}
				if(cmd.scale.indexOf('second') == 0){
					if(duration > 255){
						cmd.duration.s = 255;
						duration = Math.ceil((duration - 255)/60);
						cmd.scale = 'minutes';
					}else{
						cmd.duration.s = duration;
					}
				}
				if(cmd.scale.indexOf('minute') == 0){
					if(duration > 255){
						cmd.duration.m = 255;
						duration = Math.ceil((duration - 255)/60);
						cmd.scale = 'hours';
					}else{
						cmd.duration.m = duration;
					}
				}
				if(cmd.scale.indexOf('hour') == 0){
					cmd.duration.h = duration & 255;
				}
			}
			return this.timerOp(cmd.mtype, cmd.relay, cmd.duration);
			//handle momentary
		}else{
			['off','activate','deactivate','toggle','on'].some((v) => {
				if(v == 'activate') v = 'on';
				if(v == 'deactivate') v = 'off';
				if(cmd.op.indexOf(v) > -1) return cmd.op = v;
			});
		}
		if(!cmd.relay || cmd.bank == 0 || cmd.banks){
			if(typeof cmd.bank == 'undefined') cmd.bank = 0;
			if(typeof cmd.group == 'undefined') cmd.group = cmd.relay ? cmd.relay : 'all';
			return this.bankOp(cmd.op, cmd.bank, cmd.group);
		}
		return this.relayOp(cmd.op, cmd.relay, cmd.bank);
	}
	relayTalk(str){
		var groups = ['get', 'relay', 'group', 'bank', 'banks', 'op', 'mtype', 'duration', 'scale'];
		var m;
		var regex = /(get)|(?:(?:relay|channel) ([0-9]+))|(all|odd|even)|bank ([0-9]+)|(all) banks|(off|activate|deactivate|toggle|on)|(for|in) ([0-9]+) ([^\s]+)/gmi;
		var res = {};

		while ((m = regex.exec(str.toLowerCase())) !== null) {
		    // This is necessary to avoid infinite loops with zero-width matches
		    if (m.index === regex.lastIndex) {
		        regex.lastIndex++;
		    }
		    // The result can be accessed through the `m`-variable.
			for(var i=1;i<groups.length+1;i++){
				var g = groups[i-1];
				if(g == 'op'){
					if(typeof res.op == 'undefined') res.op = [];
					res.op.push(m[i]);
				}else{
					if(typeof m[i] != 'undefined') res[g] = m[i];
				}
			}
		}
		if(res.get){
			this.interactive = res;
			return this.status();
		}
		return this.command(res);
	}
	bank(b){
		this.interactive.bank = b;
		return this;
	}
	channel(r){return this.relay(r);}
	relay(r){
		this.interactive.relay = r;
		return this;
	}
	activate(){return this.on();}
	on(){
		this.interactive.op = 'on';
		var cmd = this.interactive;
		this.interactive = {};
		return this.command(cmd);
	}
	deactivate(){return this.off();}
	off(){
		this.interactive.op = 'off';
		var cmd = this.interactive;
		this.interactive = {};
		return this.command(cmd);
	}
	toggle(){
		this.interactive.op = 'toggle';
		var cmd = this.interactive;
		this.interactive = {};
		return this.command(cmd);
	}
	pulse(d, s){
		this.interactive.mtype = 'in';
		this.interactive.duration = d;
		this.interactive.scale = typeof s == 'undefined' ? 'seconds' : s;
		var cmd = this.interactive;
		this.interactive = {};
		return this.command(cmd);
	}
	timer(d, s){
		this.interactive.mtype = 'for';
		this.interactive.duration = d;
		this.interactive.scale = typeof s == 'undefined' ? 'seconds' : s;
		var cmd = this.interactive;
		this.interactive = {};
		return this.command(cmd);
	}
	status(){
		if(typeof this.interactive.relay == 'undefined'){
			var bank = typeof this.interactive.bank == 'undefined' ? 1 : parseInt(this.interactive.bank);
			this.interactive = {};
			return this.bankStatus(bank);
		}
		var ret = this.relayStatus(parseInt(this.interactive.relay), parseInt(this.interactive.bank));
		this.interactive = {};
		return ret;
	}
	//b stands for bits!
	readAD(b){
		var obj = this;
		var cmd = this.interactive;
		this.interactive = {};
		return new Promise((fulfill, reject) => {
			if(b == 10){
				obj.send([254, 167]).then((r) => {
					if(typeof cmd.relay == 'undefined'){
						fulfill(r);
					}else{
						var i = (cmd.relay-1)*2;
						var val = (r[i] << 8) | r[i+1];
						fulfill(val);
					}
				}).catch(reject);
			}else{
				obj.send([254, 166]).then((r) => {
					if(typeof cmd.relay == 'undefined'){
						fulfill(r);
					}else{
						fulfill(r[cmd.relay-1]);
					}
				}).catch(reject);
			}

		});
	}
}
