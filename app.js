/* Express */
var express = require('express');
var app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
app.use(express.static(__dirname + '/public'));

server.listen(3000);

io.sockets.on('connection', function (socket) {
  socket.on('query', function (data) {
    io.sockets.emit('update', { content: data.content });
  });
});
