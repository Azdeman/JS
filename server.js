var app = require('express')();
var http = require('http').createServer(app);
var mysql = require('mysql');
var WebSocket = require('ws');

app.get('/', (req, res)=>{
	res.sendFile(__dirname + '/client.html');
});

const ws = new WebSocket.Server({port:3000});

	ws.on('connection',(socket,req)=>{
		var send_key = 'websocket-key: '+req.headers['sec-websocket-key'];
		console.log('websocket-key: '+req.headers['sec-websocket-key']);
			socket.send(send_key);
	});
