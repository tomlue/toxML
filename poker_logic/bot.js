var poker = require('./Table'),
	 eval = require('./hand_evaluator');
	    _ = require('underscore');
	    
var actualbot = new bot();

exports.update = actualbot.update;
exports.act = actualbot.act;




/**
 * Bot should really be a singleton. Not sure how to handle concurrent updates though.
 */
function bot()
{	
	this.root = new HoeffdingNode();
	
	/**
	 * called on a completed hand. 
	 */
	this.update = function(table)
	{
		var instances = this.actionsToInstances(table)
		
	}

	this.act = function(player,table)
	{
		
	}
	
	this.actionsToInstances = function(actions)
	{
		var player_winamts = _.map(table.players,function(player){				
			return {player : player, 
					winamt : _.reduce(actions, function(memo,action){
						if(action.constructor == poker.WinAction && action.name == player.name)
							memo += action.amt;
						else if(action.constructor == poker.PlayerAction && action.position == player.position)
							memo -= action.amt;
						})
					}
			});
		console.log(player_winamts);				
	}	
}



function HoeffdingNode()
{
	
}

//TESTING
var socket = {};
socket.emit = function(emission){this.lastAction = emission};

var table = new poker.Table(
	new Array(
		new poker.Player('tom',0,socket),
		new poker.Player('jeff',1,socket),
		new poker.Player('dog',2,socket),
		new poker.Player('killer',3,socket)), socket);
table.next();
// console.log(table.actions);
// console.log(_.last(table.actions).constructor);


while(_.last(table.actions).constructor != poker.WinAction)
{
	table.next();
	// actualbot.update(table);
}		

var player_winamts = _.map(table.players,function(player){
	console.log('player is ' + player.name);				
	return {player : player, 
			winamt : _.reduce(table.actions, function(memo,action){
				if(action.constructor == poker.WinAction && action.name == player.name)
					memo += action.amt;
				else if(action.constructor == poker.PlayerAction && action.position == player.position)
					memo -= action.amt;
				})
			}
	});
console.log(player_winamts);	

