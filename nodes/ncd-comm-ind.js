const comms = require("ncd-red-comm");
const NcdDigiWrapper = require('../lib/NcdDigiWrapper.js');

module.exports = function(RED) {
	var devicePool = {};
    function NcdIndConfig(n) {
        RED.nodes.createNode(this,n);

		var commName, dName;
		switch(n.commType){
			case 'tcp':
				dName = `tcp-${n.tcpHost}-${n.tcpPort}`;
				commName = n.tcpHost;
				if(typeof devicePool[dName] == 'undefined'){
					devicePool[dName] = new comms.NcdTCP(n.tcpHost, parseInt(n.tcpPort));
					if(n.encrypt){
						var key = Buffer.from(n.encryptKey.replace(/-/g, ''), 'hex');
						devicePool[dName] = new comms.NcdAes(devicePool[dName], key);
					}
				}
				break;
			case 'serial':
				dName = `serial-${n.serialDev}`;
				commName = n.serialDev;
				if(typeof devicePool[dName] == 'undefined'){
					devicePool[dName] = new comms.NcdSerial(n.serialDev, parseInt(n.baudRate));
					if(n.encrypt && !n.digi){
						var key = Buffer.from(n.encryptKey.replace(/-/g, ''), 'hex');
						devicePool[dName] = new comms.NcdAes(devicePool[dName], key);
					}
				}
				break;
		}

		if(n.digi){
			var digi = new comms.NcdDigiParser(devicePool[dName]);
			this.comm = new NcdDigiWrapper(digi, n.digiMac.split(' ').map((h) => parseInt(h, 16)));
		}else{
			this.comm = devicePool[dName];
		}
    }
    RED.nodes.registerType("ncd-comm-ind", NcdIndConfig);
};
