"use strict";
const comms = require('ncd-red-comm');
const NCD = require("../index.js");
const Queue = require("promise-queue");

module.exports = function(RED){
	var connections = {};

	function NcdProXRNode(config){
		RED.nodes.createNode(this, config);
		this.addr = config.host;
		this.port = parseInt(config.port);
		var connection;
		if(typeof connections[this.addr] == 'undefined'){
			connections[this.addr] = new comms.NcdTCP(this.addr, this.port);
		}

		if(config.encrypt){
			var key = Buffer.from(config.encryptKey.replace(/-/g, ''), 'hex');
			var crypto = new comms.NcdAes(key);
			connections[this.addr].setCrypto(crypto);
		}else{
			connections[this.addr].crypto = false;
		}

		this.board = new NCD.NcdProXR( connections[this.addr] );

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
			}).catch((err) => {
				node.status({fill:"red",shape:"ring",text:"disconnected"});
				node.warn(err);
			});
		});
	}
	RED.nodes.registerType("ncd-proxr", NcdProXRNode)
}
