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

// Rate limit variables
var rateLimit1 = "You are sending messages too quickly. Please wait ";
var rateLimit2 = " and try again.";
var second = " second";
var seconds = " seconds";
var period = 30000;
var limit = 5;
var sec = 1000;

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

function broadcast (content, socket) {
  if (charCount(content) <= charLimit) {
    if (content[0] == '!' && specials(content, socket)) {
      return;
    }
    content = content.split(/\n/g);
    io.sockets.emit('update', { content: content, 
                                users: users,
                                admin: false });
  }
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
  var messages = new Array();
  var msgIndex = -1;

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
    
    // Rate limit check
    if (messages.length == limit) {
      var oldest = messages[(msgIndex+1) % limit];
      var current = Date.now();
      if (oldest + period > current) {
        var unit;
        var wait = Math.ceil((oldest + period - current)/sec);
        if (wait == 1) {
          unit = second;
        }
        else {
          unit = seconds;
        }
        socket.emit('update', { content: rateLimit1 + wait + unit + rateLimit2,
                                users: users,
                                admin: true });
      }
      else {
        msgIndex = (msgIndex+1) % limit;
        messages[msgIndex] = Date.now();
        broadcast(data.content, socket);
      }
    }
    else {
      messages.push(Date.now());
      msgIndex++;
      broadcast(data.content, socket);
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
