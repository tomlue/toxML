var socket =  io.connect('http://98.204.104.201:8000');        

$(function(){    
    
    var Player = Backbone.Model.extend({
        url: 'player',
        
        defaults: function(){
            return{
                name: "open",
                user: null,
                // order: table.players.nextOrder(),
                stack: 100,
                cards: {card1 : {rank:null,suit:null},card2:{rank:null,suit:null}}
            };        
        }                
    });
    
    var Players = Backbone.Collection.extend({
        
        model:Player,
        
        //puts player in next open seat
        // nextOrder: function(){
            // if(!this.length) return 1;
            // return this.last().get('order') + 1;
        // },        

    });
    
    var Table = Backbone.Model.extend({
    
    	url: 'table',
    
    	initialize: function(){
    		this.players = new Players;
    	}
    });
    
    var Tables = Backbone.Collection.extend({
    	
    	model: Table
    	
    })
    
    var tables = new Tables;
    
    var table = new Table;
    
    
    
    var PlayerView = Backbone.View.extend({
        
        tagName: "li",
        
        template: _.template($('#player-template').html()),
        
        events: {                       
            "dblclick .view"  : "edit",
            "click a.destroy" : "clear",
            "keypress .edit"  : "updateOnEnter"            
        },
        
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);            
        },
        
        render: function() {        	
        	console.log('before render: ' + this.el);
            this.$el.html(this.template(this.model.toJSON()));
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
    
    var tableView = Backbone.View.extend({
    	
    });
    
    var AppView  = Backbone.View.extend({
        el: $('#pokerapp'),
        
        events: {
            "click #new-table":  "newTable",                        
        },
        
        initialize: function(){
            this.input = this.$("#new-table");            
            this.listenTo(table.players, 'add', this.addOne);
            this.listenTo(table.players, 'reset', this.addAll);
            this.listenTo(table.players, 'all', this.render);            
            
            this.main = $('#main');
        },
        
        render: function() {            
            
            if (table.players.length) {
                this.main.show();                                           
              } else {
                this.main.hide();                
              }                   
        },
        
        addOne: function(player){        	          
            var view = new PlayerView({model: player});
            this.$("#players").append(view.render().el);
        },
        
        addAll: function(){
            table.players.each(this.addOne,this);
        },
        
        newTable: function(e){
        	tables.create({name: "default", })
        	var players = table.players;
        	new Array("user","zak","evan","jeff","dan","adam").map(function(name){
        		players.create({name: name});
        	});        	           
        }
    });
    
    var App = new AppView;
});