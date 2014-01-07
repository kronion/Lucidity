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

// List of IPs of all connected clients
var ipHash = {};

function specials (command, socket) {
  if (command == '!listIPs') {
    socket.emit('update', { content: ('' + Object.keys(ipHash)).replace(/,/g, '\n'),
                            users: users,
                            admin: true });
    return true;
  }
  return false;
}

io.sockets.on('connection', function (socket) {
  
  // Get client IP
  var ip = socket.handshake.headers['x-forwarded-for'] ||  
            socket.handshake.address.address;

  // Increment number of client connections if duplicate client
  if (ipHash[ip] == undefined) {
    ipHash[ip] = 1;
  }
  else {
    ipHash[ip]++;
  }

  // Initialize rate limiting data structures
  var period = 30000;
  var limit = 5;
  var messages = new Array();
  var msgIndex = 0;

  // Increment number of users
  users++;

  // Inform other users of new user
  socket.broadcast.emit('users', { users: users });

  setTimeout(function() {
    socket.emit('update', { content: intro, 
                            users: users,
                            admin: true });
  }, 500);

  socket.on('query', function (data) {
    if (messages.length == limit) {
      var oldest = messages[msgIndex+1 % limit];
      if (Date.now() + period)
      // FINISH HERE!!!

    var content = data.content;
    if (charCount(content) <= charLimit) {
      if (content[0] == '!' && specials(content, socket)) {
        return;
      }
      content = content.split(/\n/g);
      io.sockets.emit('update', { content: content, 
                                  users: users,
                                  admin: false });
    }
  });

  socket.on('disconnect', function (data) {
    if (ipHash[ip] == 1) {
      delete ipHash[ip];
    }
    else {
      ipHash[ip]--;
    }
    users=users-1;
    io.sockets.emit('users', { users: users });
  });
});
