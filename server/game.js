import {createDeck,shuffle} from './cards.js';

export function otherRole(role){
  return role==='admin' ? 'player' : 'admin';
}

export function createGame(){
  return {
    players:{},
    phase:'waiting',
    maxRounds:8,
    roundNumber:1,
    completedRounds:0,
    scores:{admin:0,player:0},
    matchEnded:false,
    matchWinner:null,
    deck:[],
    bottom:[],
    flipCard:null,
    landlord:null,
    farmer:null,
    callPlayer:null,
    callPasses:0,
    robPlayer:null,
    robRounds:0,
    robCount:0,
    robPassStreak:0,
    robMultiplier:1,
    bombCount:0,
    bombMultiplier:1,
    baseScore:1,
    doubleChoices:{admin:null,player:null},
    doublePlayer:null,
    multiplier:1,
    roundScore:0,
    roundDelta:{admin:0,player:0},
    roundSettled:false,
    turn:null,
    lastPlay:null,
    lastCards:[],
    lastPlayRole:null,
    winner:null,
    adminMutationSeq:0
  };
}

export function deal(game){
  if(game.matchEnded || game.completedRounds>=game.maxRounds) return game;

  const cards=shuffle(createDeck()).slice(0,45);
  game.roundNumber=game.completedRounds+1;
  game.deck=cards;
  game.bottom=cards.slice(42);
  game.players.admin.hand=cards.slice(0,21);
  game.players.player.hand=cards.slice(21,42);

  const dealt=cards.slice(0,42);
  game.flipCard=dealt[Math.floor(Math.random()*dealt.length)];
  game.callPlayer=findPlayerByCard(game,game.flipCard);
  game.callPasses=0;
  game.landlord=null;
  game.farmer=null;
  game.robPlayer=null;
  game.robRounds=0;
  game.robCount=0;
  game.robPassStreak=0;
  game.robMultiplier=1;
  game.bombCount=0;
  game.bombMultiplier=1;
  game.doubleChoices={admin:null,player:null};
  game.doublePlayer=null;
  game.multiplier=1;
  game.roundScore=0;
  game.roundDelta={admin:0,player:0};
  game.roundSettled=false;
  game.turn=game.callPlayer;
  game.lastPlay=null;
  game.lastCards=[];
  game.lastPlayRole=null;
  game.winner=null;
  game.adminMutationSeq=0;
  game.phase='call';
  return game;
}

function findPlayerByCard(game,card){
  for(const role of ['admin','player']){
    if(game.players[role]?.hand.some(c=>c.id===card.id)) return role;
  }
  return 'admin';
}

export function callLandlord(game,role,call){
  if(game.phase!=='call' || game.turn!==role) return false;

  if(call){
    game.callPlayer=role;
    game.landlord=role;
    game.phase='rob';
    game.robPlayer=otherRole(role);
    game.turn=game.robPlayer;
    game.robRounds=0;
    game.robCount=0;
    game.robPassStreak=0;
    game.robMultiplier=1;
    game.multiplier=1;
    return true;
  }

  game.callPasses++;
  if(game.callPasses>=2){
    deal(game);
    return true;
  }

  const other=otherRole(role);
  game.callPlayer=other;
  game.turn=other;
  return true;
}

export function resetToWaiting(game){
  for(const player of Object.values(game.players)) player.hand=[];
  game.phase='waiting';
  game.deck=[];
  game.bottom=[];
  game.flipCard=null;
  game.landlord=null;
  game.farmer=null;
  game.callPlayer=null;
  game.callPasses=0;
  game.robPlayer=null;
  game.robRounds=0;
  game.robCount=0;
  game.robPassStreak=0;
  game.robMultiplier=1;
  game.bombCount=0;
  game.bombMultiplier=1;
  game.doubleChoices={admin:null,player:null};
  game.doublePlayer=null;
  game.multiplier=1;
  game.roundScore=0;
  game.roundDelta={admin:0,player:0};
  game.roundSettled=false;
  game.turn=null;
  game.lastPlay=null;
  game.lastCards=[];
  game.lastPlayRole=null;
  game.winner=null;
  game.adminMutationSeq=0;
}

export function resetMatch(game){
  game.maxRounds=8;
  game.roundNumber=1;
  game.completedRounds=0;
  game.scores={admin:0,player:0};
  game.matchEnded=false;
  game.matchWinner=null;
  resetToWaiting(game);
  if(game.players.admin && game.players.player) deal(game);
}
