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

var charLimit = 200;

function charCount (str) {
  var newlines = str.split('\n').length - 1;
  return count = str.length + 29 * newlines;
}

io.sockets.on('connection', function (socket) {
  users = users+1;

  socket.broadcast.emit('users', { users: users });

  setTimeout(function() {
    socket.emit('update', { content: intro, 
                            users: users,
                            admin: true });
  }, 500);
  socket.on('query', function (data) {
    if (charCount(data.content) <= charLimit) {
      data.content = data.content.split(/\n/g);
      io.sockets.emit('update', { content: data.content, 
                                  users: users,
                                  admin: false });
    }
  });
  socket.on('disconnect', function (data) {
    users=users-1;
    io.sockets.emit('users', { users: users });
  });
});
