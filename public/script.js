/*----------------------------------------------------------------------------*/
/* GLOBAL VARIABLES                                                           */
/*----------------------------------------------------------------------------*/

/* Socket.io server connection */
var socket = io.connect('http://localhost:3000');

/* Message variables */
var admin = "<div class='admin'></div>";
var message1 = "<div class='message1'></div>";
var message2 = "<div class='message2'></div>";
var p = "<p></p>";
var br = "<br>";

/* User count variables */
var count1 = "Ask questions with ";
var count2 = " other users!";
var countSingle = " other user!";

/* Color variable */
var altColor = true;

/* Character count variables */
var remaining = " characters remaining.";
var remainingSingle = " character remaining.";
var limit = 200;
var characters = 0;

/* Rate limiting variables */
var lastMessage;
var rateLimit1 = "You are sending messages too quickly. Please wait ";
var rateLimit2 = "and try again.";
var second = " second ";
var seconds = " seconds ";
var displayed = false;

/* Page Visibility API */
var hidden, state, visibilityChange; 
if (typeof document.hidden !== "undefined") {
  hidden = "hidden";
  visibilityChange = "visibilitychange";
  state = "visibilityState";
} else if (typeof document.mozHidden !== "undefined") {
  hidden = "mozHidden";
  visibilityChange = "mozvisibilitychange";
  state = "mozVisibilityState";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
  state = "msVisibilityState";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
  state = "webkitVisibilityState";
}

/* Variables for messages received while page is hidden */
var hiddenCount = 0;
var intervalID;

/*----------------------------------------------------------------------------*/
/* FUNCTIONS                                                                  */
/*----------------------------------------------------------------------------*/

// Add a listener that constantly changes the title
document.addEventListener(visibilityChange, function() {
  if (!document[hidden]) {
    document.title = "Lucidity";
    hiddenCount = 0;
    clearInterval(intervalID);
  }
}, false);

/* Character count animations */
$('#query').focus(function() {
  if (characters == 199) {
    $('#charcount p').text((limit-characters) + remainingSingle);
  }
  else {
    $('#charcount p').text((limit-characters) + remaining);
  }
  $('#charcount').slideDown('slow');
});
$('#query').focusout(function() {
  $('#charcount').slideUp('slow');
});

/* Character count function */
var charCount = function(str) {
  var newlines = str.split('\n').length - 1;
  return str.length + 29 * newlines;
};

/* Character limit warning style */
function charWarning() {
  setTimeout(function() {
    characters = charCount($('#query').val());
    if (characters > 200) {
      $('#charcount p').text((limit-characters) + remaining);
      $('#charcount').css( { 'background-color': '#996666' });
    }
    else if (characters == 199) {
      $('#charcount p').text((limit-characters) + remainingSingle);
      $('#charcount').css( { 'background-color': '#646464' });
    }
    else {
      $('#charcount p').text((limit-characters) + remaining);
      $('#charcount').css( { 'background-color': '#646464' });
    }
  }, 50);
}

/* Display the message with the proper format */
function displayMessage(message, content) {
  if (content.length == 1) {
    $(p).prependTo($(message).prependTo('#stream')).text(content[0]);
  }
  else {
    $('#stream').prepend(message);
    for (var i=0; i < content.length; i++) {
      if (content[i]) {
        $(p).appendTo('#stream div:first').text(content[i]);
      }
      else {
        $('#stream div').first().append(br);
      }
    }
  }
  $('#stream div').first().slideDown('slow');
}

/* Display rate limit warnings */
function rateLimit(wait) {
  if (wait == 1) {
    $('#ratewarning p').text(rateLimit1 + wait + second + rateLimit2);
    $('#ratewarning').slideDown('slow');
  }
  else {
    $('#ratewarning p').text(rateLimit1 + wait + seconds + rateLimit2);
    $('#ratewarning').slideDown('slow');
  }
  wait = Math.ceil((lastMessage + 7000 - Date.now())/1000);
  if (wait > 0) {
    setTimeout(function () {
      rateLimit(wait);
    }, 1000);
  }
  else {
    setTimeout(function () {
      $('#ratewarning').slideUp('slow');
      displayed = false;
    }, 1000);
  }
}

/* Send a message to the socket.io server */
var send = function(e) {
  e.preventDefault();
  characters = charCount($('#query').val());
  if (characters <= limit) {
    var notEmpty = $('#query').val().replace(/\n/g, '');
    if (notEmpty) {
      if (lastMessage == undefined || lastMessage + 8000 < Date.now()) {
        socket.emit('query', {
          content: $('#query').val()
        });
        $('#query').val('');
        characters = 0;
        $('#charcount p').text((limit-characters) + remaining);
        lastMessage = Date.now();
      }
      else if (displayed == false) {
        displayed = true;
        var wait = Math.ceil((lastMessage + 8000 - Date.now())/1000);
        rateLimit(wait);
      }
    }
  }
};

/* Send button clicked */
$('#send').on('click', function(e) {
  send(e);
});

/* Message sent by 'Enter' key */
$('#query').keydown(function(e) {
  if (e.which == 13 && !e.shiftKey) {
    send(e);
  }
  else {
    charWarning();
  }
});

/* Update the user count */
function userCountUpdate(users) {
  if (users === 1) {
    $('#count').text(count1 + users + countSingle);
  }
  else {
    $('#count').text(count1 + users + count2);
  }
}

/* User update has been received */
socket.on('users', function (data) {
  userCountUpdate(data.users);
});

/* Message has been received */
socket.on('update', function (data) {

  if (document[hidden]) {
    hiddenCount++;
    var state = false;
    if (intervalID == undefined) {
      intervalID = setInterval(function () {
        if (state) {
          document.title = "Lucidity";
        }
        else {
          document.title = "(" + hiddenCount + ") Message received!";
        }
        state = !state;
      }, 2000);
    }
  }

  // Admin message
  if (data.admin) {
    $(p).prependTo($(admin).prependTo('#stream')).text(data.content);
    $('#stream div').first().slideDown('slow');
  }

  // Message 1
  else if (altColor) {
    displayMessage(message1, data.content);
  }

  // Message 2
  else {
    displayMessage(message2, data.content);
  }

  // User count update
  userCountUpdate(data.users);

  // Color flip
  altColor = !altColor;
});
