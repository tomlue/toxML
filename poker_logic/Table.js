/**
 * Constains all the controllers for playing poker on a table.
 */
var         _ = require('underscore'),
    evaluator = require('./hand_evaluator'),
    	  bot = require('./bot');

exports.Table = Table;
exports.Player = Player;
exports.WinAction = WinAction;
exports.PlayerAction = PlayerAction;

function Table(players, socket)
{	
	this.players = players;
	
	//a history of all the actions for the table.  Can construct hand histories from this.
	this.actions = new Array();	
	
	//really just contains a bunch of card dealing related functions
	this.dealer = new Dealer(socket);
	
	//keeps track of index of next player to act (-1 for dealer)
	this.turn = this.dealer.position;
	this.button = 0;
	
	/**
	 * performs the next action for the table
	 * delegating actions to players
	 * this should be the only visible function to app.js
	 * dealing cards
	 * giving wins or losses
	 */
	this.next = function()
	{	
		//needed for some of the underscore functions
		var that = this;
		
		//check if hand is over first, if so reset table
		var somebodyWon = false;
		var activePlayers = _.filter(that.players,function(player){return !player.isFolded(that);});		
		for(var i=this.actions.length-1; i>0; i--)
		{						
			if(this.actions[i].constructor == WinAction)			
				somebodyWon = true;
		}
		
		//logic for determining who is next to act (or to start new hand if hand over);		
		if(somebodyWon == true)
		{
			this.newHand();
		}
		else if(activePlayers.length == 1)
		{			
			socket.emit(this.name + '-' + activePlayers[0].name, {'type':'win','amt:':this.pot});
			this.actions.push(new WinAction(activePlayers[0].name,this.pot()));
			this.newHand();
		}
		else if(this.turn === this.dealer.position)
		{			
			this.dealer.deal(this);
			
			for(var i = (this.button+1) % this.players.length; i<this.players.length; i++)
			{
				if(!this.players[i].isFolded(this))
				{
					this.turn = i;
					break;
				}					
			}						
		}
		else
		{			
			this.players[this.turn].act(this);
			
			//increment turn to next player (unless next player is the last aggressor);
			for(var i = (this.turn+1)%this.players.length; i<this.players.length; i = (i+1)%this.players.length)
			{				
				if(i == this.lastAggressor())
				{			
					this.turn = this.dealer.position;
					break;					
				}
				else if(!this.players[i].isFolded(this))
				{					
					this.turn = i;
					break;
				}
			}	
		}		
	}
	
	this.newHand = function()
	{
		//TODO probably want to store hand information at this point		
		this.actions = new Array();
		socket.emit(this.name + '-reset');
				
		
	}
	
	/**returns the position of the last aggressor (or -1 if there is none)*/
	this.lastAggressor = function()
	{	
		var aggPos = this.dealer.position;
		for(var i=this.actions.length-1; i>0; i--)
		{
			var action = this.actions[i];
			if(action.constructor == PlayerAction)
			{		
				switch(action.type)
				{
					case('bet'): return action.position; break;
					case('post'): return action.position; break;
					default: aggPos = action.position; break; 
				}				
			}
			else if(action.constructor != PlayerAction)
			{
				if(i == this.actions.length-1)
					continue;
				else
				{
					aggPos = this.actions[i+1].position;
					break;					
				}								
			}				
		}
		
		return aggPos;
	}
	
	/**finds pot by adding up all amts in action array*/
	this.pot = function()
	{
		var pot = 0.0;
		_.each(this.actions,function(action){
			if(action.constructor == PlayerAction)
				pot += action.amt; 
		});
		
		return pot;		
	}
	
	/**finds board by adding up all cards in deal actions*/
	this.boardCards = function()
	{
		var cards = new Array();
		_.each(this.actions,function(action){
			if(action.constructor==DealAction)
				cards = cards.concat(action.cards);
		});
		return cards;
	}
	
	this.rnd = function()
	{
		var rnd = this.actions.length == 0 ? 0 : 1;
		_.each(this.actions,function(action){
			if(action.constructor==DealAction)
				rnd++;
		})
		return rnd;
	}
	
		
}

function Player(name,position,socket)
{
	this.name = name;
	this.position = position;
	this.cards = new Array();
	this.stack = 100.0;
	
	/**Just a random action*/
	this.act = function(table){
		var action = null;
		
		//you have to post if there are 0 or 1 player actions
		var numPlayerActions = 0;
		_.each(table.actions, function(action){
			if(action.constructor == PlayerAction)
				numPlayerActions++;			
		});
				
		if(numPlayerActions == 0)					
			action = new PlayerAction('post', 0.5,this.position);
			
		else if(numPlayerActions == 1)		
			action = new PlayerAction('post', 1.0,this.position);
		
		else
		{
			//pokerbot logic here
			var action = bot.act(this,table)
			var types = new Array('call','fold','bet');
			var type = types[_.random(0)];
			var amt = (type == 'bet') ? _.random(1,100) : (type == 'call') ? this.amtToCall(table) : 0.0;			
			action = new PlayerAction(type,amt,this.position);
		}
		
		//emit action to socket
		this.stack -= action.amt;
		socket.emit(table.name + '-' + this.name, action);		
		table.actions.push(action);
	}	
	
	this.amtToCall = function(table){
		var amtcmtd = 0.0;
		var amtToCall = 0.0;
		for(var i = table.actions.length-1; i>0; i--)
		{
			var action = table.actions[i];
				
			if(action.constructor == DealAction)
				break;
				
			if(action.constructor == PlayerAction)
			{	
				if(action.position == this.position)
					amtcmtd += action.amt;
				else 
					amtToCall = Math.max(amtToCall,action.amt);
			}
		}		
		return amtToCall - amtcmtd;
	};	
	
	this.isFolded = function(table)
	{				
		for(var i=table.actions.length-1; i>0; i--)
		{
			var action = table.actions[i];
			if(action.constructor == PlayerAction && action.position == this.position)				
				return action.type == 'fold';
		}
		return false;
	}
}

function Dealer(socket)
{
	this.position = -1;
	this.socket = socket;
	this.deal = function(table)
	{	
		var rnd = table.rnd();
		switch(rnd)
		{
			case 0:				
				var that = this;
				_.each(table.players,function(player){
					player.cards = that.randomCard(table,2);	
					socket.emit(table.name + '-' + player.name, player.cards);															 
					table.actions.push(new PlayerDealAction(player.position,new Array(player.cards)));
				});						
				break;
			
			case 1:
				var cards = this.randomCard(table,3);
				socket.emit(table.name + '-board', cards);				
			    table.actions.push(new DealAction('flop',cards));
				break;
			
			case 2:
				var card = this.randomCard(table);				
				socket.emit(table.name + '-board', card);				
				table.actions.push(new DealAction('turn',card));			
				break;
			
			case 3:
				var card = this.randomCard(table);				
				socket.emit(table.name + '-board', card);								
				table.actions.push(new DealAction('river',card));
				break;
				
			//win rnd			
			case 4:
				var activePlayers = _.filter(table.players,function(player){
					return !player.isFolded(table);
				});
				
				var maxVal = 0;				
				var handranks = _.map(activePlayers,function(player){
					var full_hand = table.boardCards().concat(player.cards);
					var handrank = evaluator.getScore(full_hand);
					var plyr_handrank = {"player" : player.name, "handrank" : handrank};
					maxVal = Math.max(handrank,maxVal); 
					return plyr_handrank
				});	
				
				var winners = new Array();
				
				_.each(handranks, function(handrank){					
					if(handrank.handrank === maxVal)					
						winners.push(handrank.player);											
				});		
				
				_.each(winners, function(winner){					
					table.actions.push(new WinAction(winner,table.pot/winners.length));					
					socket.emit(table.name + '-' + winner, {'type':'win','amount':table.pot/winners.length});
				});				
				break;
		}
	}	
	
	this.excludedCards = function(table)
	{		
		var excludedCards = new Array();
		excludedCards = excludedCards.concat(table.boardCards());
		_.each(table.players,function(player){excludedCards = excludedCards.concat(player.cards);});		
		return excludedCards;
	}
	

	this.randomCard = function(table,numcards)
	{
		if(typeof(numcards)=='undefined') numcards = 1;
		
		var returnCards = new Array();
		var excludedCards = this.excludedCards(table);
		while(returnCards.length < numcards)
		{
			var rank = Math.floor(Math.random() * 13)
			var suit = Math.floor(Math.random() * 4);
			var card = new Card(rank,suit);			
			if(_.filter(excludedCards.concat(returnCards),function(card){return (card.rank == rank && card.suit == suit);}).length==0)			
				returnCards.push(card);				
			
		}		
		return returnCards;
	}	
}

/**
 * type is one of {call,fold,bet,win}
 * amt is the amount the player put in pot (or won from pot)
 * @param {Object} type
 * @param {Object} amt
 * @param {Object} position position of acting player (-1 for dealer);
 */
function PlayerAction(type,amt,position)
{
	this.type = type;
	this.amt = amt;
	this.position = position;
}

function DealAction(type,cards)
{	
	this.type = type;
	this.cards = cards;	
}

function PlayerDealAction(position,cards)
{
	this.type = 'playerDeal';
	this.position = position;
	this.cards = cards;
}

function WinAction(name,amt)
{	
	this.type = 'win';
	this.name = name;	
	this.amt = amt;
}

function Card(rank,suit)
{
	this.rank = rank;
	this.suit = suit;	
}

// var socket = {};
// socket.emit = function(emission){this.lastAction = emission};
// 
// var table = new Table(
	// new Array(
		// new Player('tom',0,socket),
		// new Player('jeff',1,socket),
		// new Player('dog',2,socket),
		// new Player('killer',3,socket)), socket);
// 		
// var i = 0;
// var start = new Date().getTime();
// while(true)
// {
	// table.next();
	// if(socket.lastAction == 'undefined-reset')
	// {
		// i++;
		// var end = new Date().getTime();
		// console.log(i/(end-start) + ' hands per ms');
	// }
// 		
// }


