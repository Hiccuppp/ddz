import {createDeck,shuffle} from './cards.js';

export function createGame(){
 const deck=shuffle(createDeck()).slice(0,45);
 return {
  players:{},
  phase:'waiting',
  deck,
  bottom:deck.slice(42),
  flipCard:deck[0],
  landlord:null,
  callPlayer:null,
  robCount:0,
  turn:null,
  lastPlay:null,
  winner:null
 };
}

export function deal(game){
 const cards=[...game.deck];
 game.players.admin.hand=cards.slice(0,21);
 game.players.player.hand=cards.slice(21,42);
 game.phase='call';
 game.callPlayer=findPlayerByCard(game,game.flipCard);
 game.turn=game.callPlayer;
 return game;
}

function findPlayerByCard(game,card){
 for(const key of Object.keys(game.players)){
  if(game.players[key].hand.some(c=>c.id===card.id)) return key;
 }
 return 'admin';
}

export function callLandlord(game,role,call){
 if(game.phase!=='call'||game.callPlayer!==role) return false;
 if(call){
  game.landlord=role;
  game.phase='rob';
  game.turn=role==='admin'?'player':'admin';
 }else{
  const other=role==='admin'?'player':'admin';
  game.callPlayer=other;
  game.turn=other;
 }
 return true;
}
