const comms = require("ncd-red-comm");

module.exports = function(RED) {
	var devicePool = {};
    function NcdIndConfig(n) {
        RED.nodes.createNode(this,n);
        this.bus = n.bus;
		this.addr = parseInt(n.addr);

		var comm, commName;
		switch(n.commType){
			case 'tcp':
				commName = n.tcpHost;
				comm = new comms.NcdTCP(n.tcpHost, n.tcpPort);
				break;
			case 'serial':
				commName = n.serialDev;
				comm = new comms.NcdSerial(n.serialDev, n.baudRate);
				break;
		}
		if(n.encrypt){
			var key = Buffer.from(n.encryptKey.replace(/-/g, ''), 'hex');
			comm = new comms.NcdAes(comm, key);
		}
		devicePool[commName] = comm;
		this.comm = comm;
    }
    RED.nodes.registerType("ncd-comm-ind", NcdIndConfig);
}
