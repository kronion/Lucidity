/* Express */
var express = require('express');
var app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
io.set('log level', 1);
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

var ipHash = {};

io.sockets.on('connection', function (socket) {
  
  var ip = socket.handshake.headers['x-forwarded-for'] ||  
            socket.handshake.address.address;

  ipHash[ip] = 0;

  users = users+1;

  socket.broadcast.emit('users', { users: users });

  setTimeout(function() {
    socket.emit('update', { content: intro, 
                            users: users,
                            admin: true });
  }, 500);

  socket.on('query', function (data) {
    if (charCount(data.content) <= charLimit) {
      ipHash[ip] = ipHash[ip] + 1;
      console.log(ipHash[ip]);
      data.content = data.content.split(/\n/g);
      io.sockets.emit('update', { content: data.content, 
                                  users: users,
                                  admin: false });
    }
  });

  socket.on('disconnect', function (data) {
    delete ipHash[ip];
    users=users-1;
    io.sockets.emit('users', { users: users });
  });
});
