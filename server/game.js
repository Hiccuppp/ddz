import {createDeck,shuffle} from './cards.js';

export function createGame(){
 const deck=shuffle(createDeck()).slice(0,45);
 return {
  players:{},
  phase:'waiting',
  deck,
  landlord:null,
  bottom:deck.slice(42),
  turn:null,
  lastPlay:null
 };
}

export function deal(game){
 const cards=[...game.deck];
 game.players.admin.hand=cards.slice(0,21);
 game.players.player.hand=cards.slice(21,42);
 game.phase='call';
 return game;
}
