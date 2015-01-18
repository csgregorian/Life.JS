var express = require('express'); // Web framework
var request = require('request'); // Easy HTTP requests
var app = express();
var http = require('http').Server(app);
var cookieParser = require('cookie-parser'); // Better cookies
var bodyParser = require('body-parser'); // Post query data
var io = require('socket.io')(http); // Real-time web sockets
var stylus = require('stylus'); // Better CSS
var nib = require('nib'); // Adds vendor-prefix support to stylus
var jade = require('jade'); // Smart HTML templating
var morgan = require('morgan'); // Connection logging

function compile(str, path) {
  return stylus(str)
  .set('filename', path)
  // .set('compress', true) // Uncomment to minify CSS
  .use(nib());
}

// Middleware
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(stylus.middleware({
  src: __dirname + '/stylesheets',
  dest: __dirname + '/public',
  compile: compile
  }
));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
// app.use(express.json());
// app.use(express.urlencoded());
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(morgan('common'));

// Helper Functions
function makeID(length) {
  var text = '';
  var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}


// Routing
app.get('/', function (req, res) {
  res.render('index');
});

// Game of Life
var gridSum = function(x, y, grid) {
  var s = 0;
  for (var a = -1; a < 2; a++) {
    for (var b = -1; b < 2; b++) {
      if (a === 0 && b === 0) {
        continue;
      } else if (x + a < 0 || x + a > 63 || y + b < 0 || y + b > 63) {
        continue;
      } else {
        s += grid[x+a][y+b];
      }
    }
  }

  return s;
}


var grid = new Array(64);
for (var i = 0; i < 64; i++) {
  grid[i] = new Array(64);
}

// Sockets
io.sockets.on('connection', function(socket){
  socket.emit('update', grid);

  socket.on('toggle', function(coord) {
    grid[coord.x][coord.y] = !grid[coord.x][coord.y];
    io.emit('toggle', coord);
  });

  socket.on('update', function() {
    var ngrid = new Array(64);
    for (var i = 0; i < 64; i++) {
      ngrid[i] = new Array(64);
    }

    for (var x = 0; x < 64; x++) {
      for (var y = 0; y < 64; y++) {
        s = gridSum(x, y, grid);
        if (grid[x][y]) {
          if (s < 2 || s > 3) {
            ngrid[x][y] = false;
          } else {
            ngrid[x][y] = true;
          }
        } else {
          if (s === 3) {
            ngrid[x][y] = true;
          } else {
            ngrid[x][y] = false;
          }
        }
      }
    }

    grid = ngrid;

    io.emit('update', grid);
  });
});

// Server
http.listen(80, function(){
  console.log('Listening on localhost:80');
});
