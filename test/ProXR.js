const ncd = require('../index.js');
const comms = require('ncd-red-comm');

var key = [0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51,
		0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51,
		0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51,
		0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51]

var crypto = new comms.NcdAes(Buffer.from(key))

//var board = new ncd.NcdProXR( new comms.NcdTCP("192.168.1.46", 2101) );
var board = new ncd.NcdProXR( new comms.NcdTCP("192.168.1.46", 2101, crypto) );

//board.relayTalk('turn on relay 2 in 5 seconds').then().catch(console.log);
//board.relay(2).pulse(5).then(console.log).catch(console.log);

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

//board.relayTalk('turn off all relays').then().catch(console.log);

//board.relayTalk('toggle relay 2').then().catch(console.log);

//board.send([254,50,130,0]).then(console.log).catch(console.log);




// var key = [0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51]

//new comms.NcdAes(Buffer.from(key))

// var comm = new comms.NcdTCP("192.168.1.46", 2101);


var command = {
	relay: 'the relay to control, integer starting at 1',
	group: 'relay group - all, even, or odd',
	banks: 'if set, control all banks',
	bank: 'bank to control',
	op: 'on, off, active, deactivate, toggle',
	mtype: 'momentary type: in (pulse *in* x) or for (on *for* x)',
	duration: 'either an int, or an object with h, m, and s as keys',
	scale: 'second(s), minute(s), or hour(s), not needed if duration is an object'
}
