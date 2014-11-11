/* Express and Socket.io */
var express = require('express');
var app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);
app.use(express.compress());
app.use(express.cookieParser());
app.use(express.session({ 'secret': 'Ole Nassau' }));
app.use(express.static(__dirname + '/public'));

var chats = {};

// CURRENTLY NOT WORKING CORRECTLY!!!
// The sockets still capture events after they've been deleted from the
// hash table... I need to find a way to explicitly delete them
app.get('/:name', function(req, res) {
  console.log('connect ' + req.params.name);
  if (chats[req.params.name] === undefined) {
    console.log('initializing');
    var chat = io.of(req.params.name);
    chats[req.params.name] = { chat: chat, num: 0 };
    chat.on('connection', function(socket) {
      console.log(req.params.name);
      chats[req.params.name].num++;
      socket.broadcast.emit('test', 'this is a test');
      socket.on('query', function(data) {
        socket.broadcast.emit('test', data);   
      });
      socket.on('disconnect', function() {
        console.log('disconnect');
        if (--chats[req.params.name].num === 0) {
          console.log('removing ' + req.params.name);
          chat = null;
          chats[req.params.name] = undefined;
        }
      });
    });
  }
  else {
    console.log('count for ' + req.params.name + ' is ' + chats[req.params.name].num);
  }
  res.sendfile('public/index.html');
});

server.listen(3000);

// Message received on connection
var intro = "Welcome to Lucidity! Ask questions anonymously and get real-time" +
            " attention. Please be respectful of those who are trying to learn."

// Rate limit variables
var period = 30000;
var limit = 5;
var sec = 1000;

// Count of users besides oneself (thus the decrement by one)
var users = -1;

// Character limit per message
var charLimit = 200;

// Count message character length
function charCount (str) {
  var newlines = str.split('\n').length - 1;
  return count = str.length + 29 * newlines;
}

// List of IPs of all connected clients
var ipHash = {};

// Special server-side commands
function specials (command, socket) {
  if (command == '!listIPs') {
    socket.emit('update', { content: ('' + Object.keys(ipHash)).replace(/,/g, '\n'),
                            users: users,
                            admin: true });
    return true;
  }
  return false;
}

// Send message to all clients
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

// Handle all client connections
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

  socket.on('message', function(data) {
    console.log(data);
  });

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

  // Receive message from client
  socket.on('query', function (data) {
    
    // Rate limit check
    if (messages.length == limit) {
      var oldest = messages[(msgIndex+1) % limit];
      var current = Date.now();
      if (oldest + period > current) {
        var wait = Math.ceil((oldest + period - current)/sec);
        socket.emit('limit', { content: wait,
                                users: users,
                                admin: true });
        return;
      }
    }

    // Forward message to all users
    msgIndex = (msgIndex+1) % limit;
    messages[msgIndex] = Date.now();
    broadcast(data.content, socket);
  });

  // Client leaves
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
