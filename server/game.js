import {createDeck,shuffle} from './cards.js';

export function otherRole(role){
  return role==='admin' ? 'player' : 'admin';
}

export function createGame(){
  return {
    players:{},
    phase:'waiting',
    deck:[],
    bottom:[],
    flipCard:null,
    landlord:null,
    callPlayer:null,
    callPasses:0,
    robPlayer:null,
    robRounds:0,
    robCount:0,
    robPassStreak:0,
    turn:null,
    lastPlay:null,
    lastCards:[],
    lastPlayRole:null,
    winner:null
  };
}

export function deal(game){
  const cards=shuffle(createDeck()).slice(0,45);
  game.deck=cards;
  game.bottom=cards.slice(42);
  game.players.admin.hand=cards.slice(0,21);
  game.players.player.hand=cards.slice(21,42);

  const dealt=cards.slice(0,42);
  game.flipCard=dealt[Math.floor(Math.random()*dealt.length)];
  game.callPlayer=findPlayerByCard(game,game.flipCard);
  game.callPasses=0;
  game.landlord=null;
  game.robPlayer=null;
  game.robRounds=0;
  game.robCount=0;
  game.robPassStreak=0;
  game.turn=game.callPlayer;
  game.lastPlay=null;
  game.lastCards=[];
  game.lastPlayRole=null;
  game.winner=null;
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
  game.callPlayer=null;
  game.callPasses=0;
  game.robPlayer=null;
  game.robRounds=0;
  game.robCount=0;
  game.robPassStreak=0;
  game.turn=null;
  game.lastPlay=null;
  game.lastCards=[];
  game.lastPlayRole=null;
  game.winner=null;
}
