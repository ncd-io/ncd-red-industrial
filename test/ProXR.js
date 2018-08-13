const ncd = require('../index.js');
const comms = require('ncd-red-comm');


var comm = new comms.NcdTCP("192.168.1.46", 2101);
var key = [0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51,
		0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51,
		0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51,
		0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51]

var crypto = new comms.NcdAes(comm, Buffer.from(key))

var board = new ncd.NcdProXR( crypto );



board.init().then((s) => {
	if([85,86,87].indexOf(s[0])<0){
		console.log('bad response...');
		console.log(s);
		//board.channel(2).toggle().then(console.log).catch(console.log);
	}else{
		console.log(s);
		board.channel(2).toggle().then(console.log).catch(console.log);
		//board.channel(2).status().then(console.log).catch(console.log);
	}
	// board.channel(2).toggle().then(console.log).catch(console.log);
}).catch((err) => {
	console.log(err);
	// board.channel(2).toggle().then(console.log).catch(console.log);
	//board.channel(2).toggle().then(console.log).catch(console.log);
});
//
// var comm = new comms.NcdSerial('/dev/tty.NCDWiBleS-ESP32_SPP_SER', 115200);
//
// var crypto = new comms.NcdAes(Buffer.from("abcdefghijklmnop"));
// crypto.iv = Buffer.from("abcdefghijndskai");
//
// console.log(crypto.encrypt(Buffer.from("This should work")));
//console.log(crypto.decrypt(Buffer.from([ 184, 199, 204, 87, 21, 23, 229, 215, 106, 174, 25, 178, 198, 185, 231, 150 ])));

//var sending = Buffer.from("Testing AES");
// var buff = [];
// comm.on('data', (d) => {
// 	buff.push(d);
// });
//comm.write(crypto.encrypt(sending), (res) => {
	// setTimeout(() => {
	// 	if(buff.length){
	// 		console.log(buff);
	// 		console.log(buff.length);
	// 		//crypto.iv = Buffer.from(buff.slice(0, 16));
	// 		//crypto.iv = Buffer.from(buff);
	// 		buff = crypto.decrypt(Buffer.from(buff));
	// 		console.log(buff);
	// 		console.log(buff.toString());
	// 		process.exit(0);
	// 	}
	// }, 1000);

//});
//

//board.relayTalk('turn on relay 2 in 5 seconds').then().catch(console.log);
//board.relay(2).pulse(5).then(console.log).catch(console.log);
// var command = {
// 	relay: 'the relay to control, integer starting at 1',
// 	group: 'relay group - all, even, or odd',
// 	banks: 'if set, control all banks',
// 	bank: 'bank to control',
// 	op: 'on, off, active, deactivate, toggle',
// 	mtype: 'momentary type: in (pulse *in* x) or for (on *for* x)',
// 	duration: 'either an int, or an object with h, m, and s as keys',
// 	scale: 'second(s), minute(s), or hour(s), not needed if duration is an object'
// }
