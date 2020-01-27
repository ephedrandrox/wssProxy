const https = require('https');
const fs = require('fs');
const WebSocketClient = require('websocket').client;
const WebSocketServer = require('websocket').server;

let listenPort = 443;
let listenAddress = "0.0.0.0";
let forwardAddress = "localhost";
let forwardPort = 8080;
let certificateFile = "cert.pem";
let privateKeyFile = "key.pem";

function originIsAllowed(origin){
	// Could Put logic to control accepted connections
	// based on origin. For now all connections accepted
	return true;
}


process.argv.forEach(function (val, index, array) {


	if (val.substr(0,11) == "listenPort=")
	{
		listenPort = val.substr(11);
		console.log("Listen Port set to: " + listenPort);
	}
	else if (val.substr(0,14) == "listenAddress=")
	{
		listenAddress = val.substr(14);
		console.log("Listen Address set to: " + listenAddress);
	}
	else if (val.substr(0,15) == "forwardAddress=")
	{
		forwardAddress = val.substr(15);
		console.log("Forward Address set to: " + forwardAddress);
	}
	else if (val.substr(0,12) == "forwardPort=")
	{
		forwardPort = val.substr(12);
		console.log("Forward Port set to: " + forwardPort);
	}
	else if (val.substr(0,16) == "certificateFile=")
	{
		certificateFile = val.substr(16);
		console.log("Certificate File set to: " + certificateFile);
	}
	else if (val.substr(0,15) == "privateKeyFile=")
	{
		privateKeyFile = val.substr(15);
		console.log("Private Key File set to: " + privateKeyFile);
	}
	else
	{
		console.log("not recognized" + index + ': ' + val);
	}
});


try{

	let privateKey = fs.readFileSync(privateKeyFile).toString();
	let certificate = fs.readFileSync(certificateFile).toString();

	const options = {
		key: privateKey,
		cert: certificate
	};

	let server = https.createServer(options, (req, res) => {
		res.writeHead(200);
		res.end('hello world\n');
	});

	server.listen(listenPort);

	let wsServer = new WebSocketServer({
		httpServer: server,
		autoAcceptConnections: false
	});

	wsServer.on('request', function(request){
		console.log("Request received");

		if (!originIsAllowed(request.origin)){
			request.reject();
			console.log((new Date()) + ' Connection from origin ' + request.origin + "rejected");
			return;
		}
		else
		{
			let wsServerConnection = request.accept(null, request.origin);
			let wsClientConnection = new WebSocketClient();

			wsClientConnection.on('connectFailed', function(error){
				console.log("Connect Error: " + error.toString());
			});

			wsClientConnection.on('connect', function(connection) {
				console.log('Websocket Client Connected');
				wsClientConnection.connection= connection;
				connection.on('message', function(message) {
					if (message.type === 'utf8'){
						wsServerConnection.sendUTF(message.utf8Data);
					}
					else
					{
						console.log("non utf8 Data received, not forwarding");
					}
				});
			});

			wsClientConnection.connect('ws://'+ forwardAddress +':' + forwardPort+ '/');

			wsServerConnection.on('message', function(message){
				console.log("MESSAGE received");

				if (message.type === 'utf8'){
					if (wsClientConnection.connection){
						console.log("Sending data to forward");
						wsClientConnection.connection.sendUTF(message.utf8Data);
					}else
					{
						console.log("waiting to send data to conspiron");
						wsClientConnection.on('connect', function(connection) {
							console.log("Connected and sending" + message.utf8Data);
							connection.sendUTF(message.utf8Data);
						});
					}
				}
				else if (message.type === 'binary') {
					//	console.log('Received Binary Message:' + message.binaryData.length + 'bytes');
				}
				else
				{
					console.log("Unknown Message Type");
				}
			});

			wsServerConnection.on('close', function(reasonCode, description){
				console.log((new Date()) + ' Peer ' + wsServerConnection.remoteAddress + ' disconnected.');
				wsClientConnection.connection.close();
			});
		}
	});

}catch(error)
{
	console.log("Error encountered...");
	console.log(error.message);
}

