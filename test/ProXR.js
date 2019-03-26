const ncd = require('../index.js');
//To use this in a custom package, comment out the previous line and uncomment the next one
//const ncd = require('ncd-red-industrial');

const comms = require('ncd-red-comm');

//Create Serial Connection
var serial = new comms.NcdSerial('/dev/tty.usbserial-A106F1ZE', 115200);

//Create Local Digi Modem
var digi = new comms.NcdDigiParser(serial);

//Create Remote Digi Modem for ProXR Board, second argument is Digi Address to target
var comm = new ncd.NcdDigiWrapper(digi, [0x00,0x13,0xa2,0x00,0x41,0x81,0x51,0x66]);

//Create ProXR Board
var board = new ncd.NcdProXR( comm );

//Initialize connection by sending test command
board.init().then((s) => {
	//If the response does not contain 85, 86, or 87 there was an error on the ProXR side
	if([85,86,87].indexOf(s[0])<0){
		console.log('bad response...', s);
	}else{
		//Toggle channel 2 on remote board
		board.channel(2).toggle().then(console.log).catch(console.log);
	}
}).catch((err) => {
	//If there was an error communicating with the module or the module returned an error
	console.log(err);
});

//Methods to select channel/relay are either "board.channel(n) or board.relay(n)"
//For boards with more than one bank the bank can be selected like this "board.bank(n)"
//Action methods include toggle, on (or activate), off (or deactivate), pulse, timer, status, and readAD
//All methods can be daisy chained:
//	board.bank(2).relay(6).pulse(2, 'seconds').then().catch(console.log);

//or used individually:
//	board.bank(2);
//	board.relay(6);
//	board.timer(5, 'minutes').then().catch(console.log);

//The "relayTalk" method allows you to send human readable commands to the board
//board.relayTalk('turn on relay 2 in 5 seconds').then().catch(console.log);
