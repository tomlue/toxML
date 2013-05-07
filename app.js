
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')  
  , http = require('http')
  , path = require('path')  
  , sio = require('socket.io')  

var app = express();

app.configure(function(){
  app.set('port', 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = sio.listen(server);
io.set('log level', 1);
io.sockets.on('connection', function(socket){    
	console.log('got a connection');

  socket.on("create_project",function(project){    
    socket.emit("add_project",project);   
  })
  	
});












