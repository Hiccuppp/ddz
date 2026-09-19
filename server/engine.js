import {analyze,canBeat,removeCards} from './play.js';

export function playTurn(game, role, cards){
  const player=game.players[role];
  if(!player) return {ok:false,error:'player not found'};
  if(game.phase!=='playing') return {ok:false,error:'not playing'};
  if(game.turn!==role) return {ok:false,error:'not your turn'};

  const type=analyze(cards);
  if(!type) return {ok:false,error:'invalid cards'};

  if(game.lastPlay && !canBeat(game.lastPlay,type)){
    return {ok:false,error:'cannot beat'};
  }

  if(!removeCards(player.hand,cards)){
    return {ok:false,error:'cards missing'};
  }

  game.lastPlay=type;
  game.lastCards=cards;
  game.turn=Object.keys(game.players).find(v=>v!==role);

  if(player.hand.length===0){
    game.phase='finished';
    game.winner=role;
  }

  return {ok:true};
}
