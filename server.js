var ioreq = require('socket.io'),
	http = require('http'),
	fs = require('fs');

var server = http.createServer(function(req, resp) {
	fs.readFile(__dirname + '/index.htm', function(err, data) {
		if(err) {
			resp.writeHead(500);
			resp.end('An error occurred!');
		} else {
			resp.writeHead(200);
			resp.end(data);
		}
	});
});

var io = ioreq.listen(server);
io.sockets.on('connection', function (socket) {
	var client = http.createClient(5984, 'localhost');
	var req = client.request('/test/_changes?feed=continuous');
	req.end();
	req.on('response', function(response) {
		response.setEncoding('ascii');
		response.on('data', function(chunk) {
			var update = JSON.parse(chunk);
			if(update.id) {
				console.log('has id ' + update.id);
				var getDocClient = http.createClient(5984, 'localhost');
				var docReq = getDocClient.request('/test/' + update.id);
				docReq.end();
				docReq.on('response', function(docResp) {
					docResp.setEncoding('ascii');
					docResp.on('data', function (doc) {
						socket.emit('update', doc);		
					});
				});
			}

		});
	});
});

server.listen(8080);
console.log('listening on 8080');

