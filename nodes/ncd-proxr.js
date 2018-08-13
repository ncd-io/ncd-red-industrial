"use strict";
const comms = require('ncd-red-comm');
const NCD = require("../index.js");
const Queue = require("promise-queue");

module.exports = function(RED){

	function NcdProXRNode(config){
		RED.nodes.createNode(this, config);

		this.board = new NCD.NcdProXR( RED.nodes.getNode(config.connection).comm );

		var node = this;

		this.board.init().then((s) => {
			if([85,86,87].indexOf(s[0])<0){
				node.warn('Could not establish connection with controller');
				node.status({fill:"red",shape:"ring",text:"disconnected"});
			}else{
				node.status({fill:"green",shape:"dot",text:"connected"});
			}
		}).catch((err) => {
			node.warn(err);
			node.status({fill:"red",shape:"ring",text:"disconnected"});
		});

		node.on('input', (msg) => {
			var method;
			if(typeof msg.payload == 'object'){
				method = "command";
			}else{
				if(msg.topic == 'json'){
					method = "command";
					msg.payload = JSON.parse(msg.payload);
				}else{
					method = 'relayTalk';
				}
			}
			node.board[method](msg.payload).then((r) => {
				node.status({fill:"green",shape:"dot",text:"connected"});
				msg.command = msg.payload;
				msg.payload = r;
				node.send(msg);
			}).catch((err) => {
				node.status({fill:"red",shape:"ring",text:"disconnected"});
				node.warn(err);
			});
		});
	}
	RED.nodes.registerType("ncd-proxr", NcdProXRNode)
}
