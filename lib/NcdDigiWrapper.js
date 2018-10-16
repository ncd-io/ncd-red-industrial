const events = require("events");
module.exports = class NcdDigiWrapper{
	constructor(parser, mac){
		this.parser = parser;
		this.mac = mac;
		this._emitter = new events.EventEmitter();
		var that = this;
		parser.on('receive_packet', (packet) => {
			var mac = packet.mac.split(':').map((h) => parseInt(h, 16)).join(',');
			if(mac != that.mac.join(',')) return;
			packet.data.forEach((d) => {
				that._emitter.emit('data', d);
			});
		});
	}
	on(a,b){this._emitter.on(a,b);}
	write(a, cb){
		this.parser.send.transmit_request(this.mac, [...a]).then(cb).catch(console.log);
	}
}
