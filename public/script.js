var socket = io.connect('http://localhost:3000');

/* Message part variables */
var message1 = "<div class='message1' id=";
var message2 = "<div class='message2' id=";
var admin = "<div class='admin' id=";
var middle = "><p>";
var close = "</p></div>";
var admin2 = "<div class='admin'></div>";
var message12 = "<div class='message1'></div>";
var message22 = "<div class='message2'></div>";
var paragraph = "<p></p>";

/* User count variables */
var count1 = "Ask questions with ";
var count2 = " other users!";
var countSingle = " other user!";

var bool = true;

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
var localCount = 0;

/* Character count animations */
$('#query').focus(function() {
  if (characters == 199) {
    $('#charcount p').text((limit-characters) + remainingSingle);
  }
  else $('#charcount p').text((limit-characters) + remaining);
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
        localCount++;
      }
      else {
        var wait = Math.ceil((lastMessage + 8000 - Date.now())/1000);
        if ($('#a'+localCount).length == 0) {
          $('#stream').prepend(admin + "a" + localCount + middle + close); 
        }
        if (wait == 1) {
          $('#a'+localCount+' p').text(rateLimit1 + wait + second
                                        + rateLimit2);
        }
        else {
          $('#a'+localCount+' p').text(rateLimit1 + wait + seconds 
                                        + rateLimit2);
        }
        $('#a'+localCount).slideDown('slow');
      }
    }
  }
};

$('#send').on('click', function(e) {
  send(e);
});

$('#query').keydown(function(e) {
  if (e.which == 13 && !e.shiftKey) {
    send(e);
  }
  else {
    charWarning();
  }
});

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

/* Update the user count */
function userCountUpdate(users) {
  if (users === 1) {
    $('#count').text(count1 + users + countSingle);
  }
  else {
    $('#count').text(count1 + users + count2);
  }
}

/* Display the message with the proper format */
function displayMessage(message, content) {
  if (content.length == 1) {
    $(paragraph).prependTo($(message).prependTo('#stream')).text(content[0]);
  }
  else {
    $('#stream').prepend(message);
    for (var i=0; i < content.length; i++) {
      if (content[i]) {
        $(paragraph).appendTo('#stream div:first').text(content[i]);
      }
      else {
        $('#stream div').first().append('<br>');
      }
    }
  }
  $('#stream div').first().slideDown('slow');
}

/* Message has been received */
socket.on('update', function (data) {

  // Admin message
  if (data.admin) {
    $(paragraph).prependTo($(admin2).prependTo('#stream')).text(data.content);
    $('#stream div').first().slideDown('slow');
  }

  // Message 1
  else if (bool) {
    displayMessage(message12, data.content);
  }

  // Message 2
  else {
    displayMessage(message22, data.content);
  }

  // User count update
  userCountUpdate(data.users);

  // Color flip
  bool = !bool;
});

/* User update has been received */
socket.on('users', function (data) {
  userCountUpdate(data.users);
});
