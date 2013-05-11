
/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')  
  , widgets = require('./widgets')
  , http = require('http')
  , path = require('path')  
  , pg = require('pg')
  , sio = require('socket.io')  

var app = express();

var client = new pg.Client("tcp://postgres:ashtree1@localhost:5432/toxML");

console.log("connecting to postgres")
client.connect(function(err) {
  
  if(err) console.log(err)
  

  client.query('SELECT NOW() AS "theTime"', function(err, result) {
      if (err) console.log(err)
      console.log(result.rows[0].theTime);
  })

});

app.configure(function(){
  app.set('port', 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');  
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes['index']);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = sio.listen(server);
io.set('log level', 1);
io.sockets.on('connection', function(socket){    	
  
  //When a new project is created add the project to our database and emit add_project
  socket.on("create_project",function(project){
    var insertStr = "INSERT INTO projects (name,widgets) \
                      VALUES ('" + project.name + "','{data}')"    
    
    client.query(insertStr, function(err,result){
      if(err) console.log(err)
      socket.emit("add_project",project)
    })
  })

  //when a project is opened return the project from the db
  socket.on("open_project",function(name){
    var selectStr = "SELECT * FROM projects WHERE name = '" + name + "'"
    
    client.query(selectStr, function(err,result){
      console.log(result)
      console.log(result.rows)
      var project = {name : result[0].name, widgets: result[0].widgets}
      console.log(project)
      console.log("widgets:" + project.widgets)      

    })
  })
});


