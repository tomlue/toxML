var socket =  io.connect('http://98.204.104.201:8000');        

$(function(){
	
	var Board = Backbone.Model.extend({
		urlRoot: 'board',
		
		initialize: function(){
			this.id = this.get('tid') + '-board';
			this.set('cards', new Array());
			var that = this;
			console.log('created board:' + this.id);
			socket.on(this.id, function(data){that.update(data);});
		},
		
		update: function(cards)
		{	
			console.log("set cards");
			this.set('cards', this.get('cards').concat(cards));			
		},
		
		reset: function(){
			console.log('reset cards!');
			this.set('cards', new Array());
		}
	});
	
	var BoardView = Backbone.View.extend({
        
        events: {                                  
        },
        
        initialize: function() {
        	var that = this;
            this.listenTo(this.model, 'change', function(){that.render();});
            // this.listenTo(this.model, 'destroy', this.remove);            
        },
        
        render: function() 
        {        	
        	var cards = this.model.get('cards');
        	var ranks = new Array('2','3','4','5','6','7','8','9','T','J','Q','K','A');
        	var suits = new Array('s','c','h','d');
        	var html = '';
        	_.each(cards, function(card){html += ranks[card.rank] + suits[card.suit] + ' ' });        	
    		this.$el.html('board-' + html);   
                      
            return this;
        },        
            
        edit: function() {            
            this.$el.addClass("editing");
            this.input.focus();
        },
            
        updateOnEnter: function(e) {            
            if (e.keyCode == 13) this.close();
        },
            
        clear: function() {
            this.model.destroy();
        }        
    });
	
	var Player = Backbone.Model.extend({
        
        urlRoot: 'player',
        
        initialize: function()
        {        	
        	this.id = this.get('tid') + '-' + this.get('name');
        	this.set('cards', new Array());
        	
        	//listens for actions for this player on server
        	var that = this;
        	socket.on(this.id, function(data){
        		that.update(data);
        	});
        	
        },
        
        update: function(action)
        {   
        	if(action.amt >= 0){ //player action
        		console.log(this.get('name') + ' ' + action.type + ' ' + action.amt)
        		this.set('stack',this.get('stack') - action.amt);
        	}         	        	   
        	else //deal action
        		this.set('cards',action);
        },
        
        //resets cards and actions
        reset: function()
        {
        	//TODO need to add actions reseting
        	console.log('resetting player ' + this.get('name'));
        	this.set('cards',new Array());
        }
        
        
        
    });
    
    var Players = Backbone.Collection.extend({
    	url: 'players',
        
        model:Player
    });
        
    var Table = Backbone.Model.extend({    
    	urlRoot: 'table',
    	
    	initialize: function(){
    		this.id = this.get('name');
    		
    		//listen for a table reset
    		var that = this;
			socket.on(that.get('name') + '-reset', function(){
				that.get('players').each(function(player){player.reset();});
				that.get('board').reset();
    		});
    	}
    });
    
    var Tables = Backbone.Collection.extend({
    	
    	url: 'tables',
    	    	
    	model: Table   	

    });
    
    var tables = new Tables;    
    
    
    var PlayerView = Backbone.View.extend({
    	    		
        tagName: "div",        
        
        
        events: {                       
            "dblclick .view"  : "edit",
            "click a.destroy" : "clear",
            "keypress .edit"  : "updateOnEnter"            
        },
        
        initialize: function() {
        	var that = this;
            this.listenTo(this.model, 'change', function(){that.render;});
            // this.listenTo(this.model, 'destroy', this.remove);            
        },
        
        render: function() 
        {
        	//TODO probably cards should be their own model
        	var cards = this.model.get('cards');
        	var ranks = new Array('2','3','4','5','6','7','8','9','T','J','Q','K','A');
        	var suits = new Array('s','c','h','d');    
        	
        	if(cards.length > 1)
        	{        		
        		this.$el.html(this.model.get('name') + ' ' + this.model.get('stack') + ' ' + 
        			           	ranks[cards[0].rank] + suits[cards[0].suit] + ',' + ranks[cards[1].rank] + suits[cards[1].suit]);        		
        	}else
        	{
        		this.$el.html(this.model.get('name') + ' ' + this.model.get('stack') + ' ' + '??');        		
        	}
                     
            return this;
        },        
            
        edit: function() {            
            this.$el.addClass("editing");
            this.input.focus();
        },
            
        updateOnEnter: function(e) {            
            if (e.keyCode == 13) this.close();
        },
            
        clear: function() {
            this.model.destroy();
        }        
    });
    
    var TableView = Backbone.View.extend({    
    		
        tagName:'div',
        
        events: {   
        },
        
        initialize: function() 
        {            
            this.listenTo(this.model.get('players'), 'add', this.addOne);            
            this.listenTo(this.model.get('players'), 'all', this.render);            
        },
        
        addOne: function(player){
        	//TODO actually should do something here.
        	throw new Exception("trying to add one?");
        },
        
        render: function() 
        {        	
        	var that = this;
        	this.el.id = 'table-' + this.model.get('name');
        	this.$el.html('table ' + this.model.get('name'));
        	
        	this.model.get('players').forEach(function(player){        		
        		var view = new PlayerView({model : player});
        		that.$el.append(view.render().el);        		
        	});
        	
        	var boardView = new BoardView({model: this.model.get('board')});
        	this.$el.append(boardView.render().el);
        	
            return this;
        },        
                      
        clear: function() {
            this.model.destroy();
        }
    });
    
    var AppView  = Backbone.View.extend({
        el: $('#pokerapp'),
        
        events: {
            "click #new-table":  "newTable",   
            "click #next": "next",                     
        },
        
        initialize: function(){                 
            this.listenTo(tables, 'add', this.addOne);
            this.listenTo(tables, 'reset', this.addAll);
            this.listenTo(tables, 'all', this.render);            
            
            this.main = $('#main');
        },
        
        render: function() {           
        
        },
        
        addOne: function(table){        	
            var view = new TableView({model: table});
            this.$("#tables").append(view.render().el);
        },
        
        addAll: function(){
            tables.each(this.addOne,this);
        },
        
        newTable: function(e){        	
    		socket.emit('create_table');    	
    		
    		socket.once('table_created',function(data)
    		{   
    			console.log(data.name);
    			var table = new Table({name:data.name});
    			
    			var players = new Players;    			
    			
    			for(var i = 0; i < data.players.length; i++)
    				players.create(new Player({name:data.players[i].name,stack:data.players[i].stack,tid:table.id}));    				
    			table.set('players', players);    			
    			
    			table.set('board', new Board({tid:table.id}));
    			
    			tables.create(table);
    		});
        },
        
        next: function(e)
        {
        	//TODO should listen for a response before emitting another update
        	//TODO should insure that all update were made for last update before emitting another update
        	window.setInterval(function(){console.log('update_table');socket.emit('update_table');},500);
        }
    });
    
    var App = new AppView;
});