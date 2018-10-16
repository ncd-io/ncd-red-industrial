const comms = require("ncd-red-comm");
const NcdDigiWrapper = require('../lib/NcdDigiWrapper.js');

module.exports = function(RED) {
	var devicePool = {};
    function NcdIndConfig(n) {
        RED.nodes.createNode(this,n);

		var comm, commName;
		switch(n.commType){
			case 'tcp':
				commName = n.tcpHost;
				comm = new comms.NcdTCP(n.tcpHost, parseInt(n.tcpPort));
				break;
			case 'serial':
				commName = n.serialDev;
				comm = new comms.NcdSerial(n.serialDev, parseInt(n.baudRate));
				break;
		}
		if(n.encrypt){
			var key = Buffer.from(n.encryptKey.replace(/-/g, ''), 'hex');
			comm = new comms.NcdAes(comm, key);
		}
		devicePool[commName] = comm;
		if(n.digi){
			var digi = new comms.NcdDigiParser(comm);
			this.comm = new NcdDigiWrapper(digi, n.digiMac.split(' ').map((h) => parseInt(h, 16)));
		}else{
			this.comm = comm;
		}
    }
    RED.nodes.registerType("ncd-comm-ind", NcdIndConfig);
}
