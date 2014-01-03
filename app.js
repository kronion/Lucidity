/* Express */
var express = require('express');
var app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
app.use(express.static(__dirname + '/public'));

server.listen(3000);

var intro = "Welcome to Lucidity! Ask questions anonymously and get real-time" +
            " attention. Please be respectful of those who are trying to learn."

var users = -1;

io.sockets.on('connection', function (socket) {
  users = users+1;

  socket.broadcast.emit('users', { users: users });

  setTimeout(function() {
    socket.emit('update', { content: intro, 
                            users: users,
                            admin: true });
  }, 500);
  socket.on('query', function (data) {
    data.content = data.content.split(/\n/g);
    console.log(data.content);
    io.sockets.emit('update', { content: data.content, 
                                users: users,
                                admin: false });
  });
  socket.on('disconnect', function (data) {
    users=users-1;
    io.sockets.emit('users', { users: users });
  });
});
