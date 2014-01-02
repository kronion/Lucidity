var socket = io.connect('http://localhost:3000');

var message1 = "<div class='message1' id=";
var message2 = "<div class='message2' id=";
var admin = "<div class='admin' id=";
var middle = "><p>";
var close = "</p></div>";

var count1 = "Ask questions with ";
var count2 = " other users!";
var countSingle = " other user!";

var bool = true;
      
var remaining = " characters remaining.";
var remainingSingle = " character remaining.";
var limit = 200;
var characters = 0;

var lastMessage;
var rateLimit1 = "You are sending messages too quickly. Please wait ";
var rateLimit2 = "and try again.";
var second = " second ";
var seconds = " seconds ";
var localCount = 0;

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
  else if (e.which == 13 && e.shiftKey) {
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
  else {
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
});
function paste(e) {
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

socket.on('update', function (data) {
  if (data.admin) {
    $('#stream').prepend(admin + data.id + middle + close);
    $('#'+data.id+' p').text(data.content);
    $('#'+data.id).slideDown('slow');
    if (data.users === 1) {
      $('#count').text(count1 + data.users + countSingle);
    }
    else {
      $('#count').text(count1 + data.users + count2);
    }
  }
  else if (bool) {
    $('#stream').prepend(message1 + data.id + middle + close);
    if (data.content.length == 1) {
      $('#'+data.id+' p').text(data.content[0]);
      $('#'+data.id).slideDown('slow');
    }
    else {
      for (var i=0; i < data.content.length-1; i++) {
        if (data.content[i]) {
          $('#'+data.id+' p:last').text(data.content[i]);
        }
        else $('#'+data.id).append('<br>');
        $('#'+data.id).append('<p></p>');
      }
      if (data.content[data.content.length-1]) {
        $('#'+data.id+' p:last').text(data.content[data.content.length-1]);
      }
      else $('#'+data.id).append('<br>');
      $('#'+data.id).slideDown('slow');
    }
    if (data.users === 1) {
      $('#count').text(count1 + data.users + countSingle);
    }
    else {
      $('#count').text(count1 + data.users + count2);
    }
    bool = false;
  }
  else {
    $('#stream').prepend(message2 + data.id + middle + close);
    if (data.content.length == 1) {
      $('#'+data.id+' p').text(data.content[0]);
      $('#'+data.id).slideDown('slow');
    }
    else {
      for (var i=0; i < data.content.length-1; i++) {
        if (data.content[i]) {
          $('#'+data.id+' p:last').text(data.content[i]);
        }
        else $('#'+data.id).append('<br>');
        $('#'+data.id).append('<p></p>');
      }
      if (data.content[data.content.length-1]) {
        $('#'+data.id+' p:last').text(data.content[data.content.length-1]);
      }
      else $('#'+data.id).append('<br>');
      $('#'+data.id).slideDown('slow');
    }
    if (data.users === 1) {
      $('#count').text(count1 + data.users + countSingle);
    }
    else {
      $('#count').text(count1 + data.users + count2);
    }
    bool = true;
  }
});
socket.on('users', function (data) {
  if (data.users === 1) {
    $('#count').text(count1 + data.users + countSingle);
  }
  else {
    $('#count').text(count1 + data.users + count2);
  }
});
