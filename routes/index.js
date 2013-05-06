
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.table = function(req,res){
	res.render('table',{ title: 'Poker'});
}

exports.player = function(req,res){
	res.render('player',{ title: 'Player'});
}
