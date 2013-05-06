// Poker Hand Evaluator by Pat Wilson ©2012 (Chrome|IE8|IE9)
var _ = require('underscore');
hands=["4 of a Kind", "Straight Flush", "Straight", "Flush", "High Card",
       "1 Pair", "2 Pair", "Royal Flush", "3 of a Kind", "Full House", "-Invalid-" ];
handRanks = [8,9,5,6,1,2,3,10,4,7,0];

function calcIndex(cs,ss) {
  var v, i, o, s;
  for (i=-1, v=o=0; i<5; i++, o=Math.pow(2,cs[i]*4)) {v += o*((v/o&15)+1);}; v %= 15;
  if (v!=5) {return v-1;}
  s = 1<<cs[0]|1<<cs[1]|1<<cs[2]|1<<cs[3]|1<<cs[4];
  v -= ((s/(s&-s) == 31) || (s == 0x403c) ? 3 : 1);
  return v - (ss[0] == (ss[0]|ss[1]|ss[2]|ss[3]|ss[4])) * ((s == 0x7c00) ? -5 : 1);
}

function getCombinations(k,n) {    
    var result = [], comb = [];
        function next_comb(comb, k, n ,i) {
            if (comb.length === 0) {for (i = 0; i < k; ++i) {comb[i] = i;} return true;}
            i = k - 1; ++comb[i];
            while ((i > 0) && (comb[i] >= n - k + 1 + i)) { --i; ++comb[i];}
            if (comb[0] > n - k) {return false;} // No more combinations can be generated
            for (i = i + 1; i < k; ++i) {comb[i] = comb[i-1] + 1;}
            return true;
        }
    while (next_comb(comb, k, n)) { result.push(comb.slice());}
    return result;
}

function getPokerScore(cs) {    
    var a = cs.slice(), d={}, i;
    for (i=0; i<5; i++) {d[a[i]] = (d[a[i]] >= 1) ? d[a[i]] + 1 : 1;}
    a.sort(function(a,b){return (d[a] < d[b]) ? +1 : (d[a] > d[b]) ? -1 : (b - a);});
    return a[0]<<16|a[1]<<12|a[2]<<8|a[3]<<4|a[4];
}    
    
function rankHand(ranks,suits) {
    var index = 10;
    var pokerscore = null;            
    if (ranks.length == suits.length) 
    {
        var o = {}, keyCount = 0, j; 
        for (i = 0; i < ranks.length; i++) { e = ranks[i]+suits[i]; o[e] = 1;}
        for (j in o) { if (o.hasOwnProperty(j)) { keyCount++;}}
                       
        if (ranks.length >=5) 
        {         
	         if (ranks.length == suits.length && ranks.length == keyCount) 
	         {
	            for (i=0;i<ranks.length;i++) { ranks[i]-=0; }
	            for (i=0;i<suits.length;i++) 
	                { suits[i] = Math.pow(2, (suits[i].charCodeAt(0)%9824)); }
	            var c = getCombinations(5, ranks.length);
	            var maxRank = 0, winIndex = 10;
	            var winning_cs = null;
	            
	            for (i=0; i < c.length; i++) 
	            {
	                 var cs = [ranks[c[i][0]], ranks[c[i][1]], ranks[c[i][2]], 
	                           ranks[c[i][3]], ranks[c[i][4]]];	                 
	                 var ss = [suits[c[i][0]], suits[c[i][1]], suits[c[i][2]], 
	                           suits[c[i][3]], suits[c[i][4]]];
	                 index = calcIndex(cs,ss);
	                     
	                 if (handRanks[index] > maxRank) 
	                 {
	                     maxRank = handRanks[index];
	                     winIndex = index; 
	                     wci = c[i].slice();
	                     winning_cs = cs;
	                 } else if (handRanks[index] == maxRank) 
	                 {
	                     //If by chance we have a tie, find the best one
	                     var score1 = getPokerScore(cs);
	                     var score2 = getPokerScore([ranks[wci[0]],ranks[wci[1]],ranks[wci[2]],ranks[wci[3]],ranks[wci[4]]]);
	                     if (score1 > score2) { wci= c[i].slice(); winning_cs = cs; }
	                 }
	             } 
	             index = winIndex;
	         }                     
        }
    }    
	return handRanks[index]*1000000 + getPokerScore(winning_cs);    
}


/**
 * transforms from a 0-indexed rank to a 2-indexed rank
 * Takes a cards {{rank,suit}{rank,suit}...} and returns pokerscore of highest scoring 5 cards combination
 */
function getScore(cards)
{    
	var suitMap = {0:"♠",1:'♣',2:'♥',3:'♦'};
	var suits = _.map(cards,function(card){return suitMap[card.suit];});
	var ranks = _.map(cards,function(card){return "" + (card.rank+2);});
	return rankHand(ranks,suits);    	   
}  

exports.getScore = getScore;


