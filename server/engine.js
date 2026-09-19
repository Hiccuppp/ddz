import {analyze,canBeat,removeCards} from './play.js';
import {otherRole} from './game.js';

function finishIfWon(game){
  const landlord=game.landlord;
  if(!landlord) return false;

  if(game.players[landlord].hand.length===0){
    game.phase='finished';
    game.winner=landlord;
    game.turn=null;
    return true;
  }

  const farmer=otherRole(landlord);
  const farmerCount=game.players[farmer].hand.length;
  if(farmerCount===0 || farmerCount<=game.robCount){
    game.phase='finished';
    game.winner=farmer;
    game.turn=null;
    return true;
  }

  return false;
}

export function playTurn(game,role,cards){
  const player=game.players[role];
  if(!player) return {ok:false,error:'玩家不存在'};
  if(game.phase!=='playing') return {ok:false,error:'当前不是出牌阶段'};
  if(game.turn!==role) return {ok:false,error:'还没轮到你'};
  if(!Array.isArray(cards) || cards.length===0) return {ok:false,error:'请选择要出的牌'};

  const analyzed=analyze(cards);
  if(!analyzed) return {ok:false,error:'牌型不合法'};

  if(game.lastPlay && !canBeat(game.lastPlay,analyzed)){
    return {ok:false,error:'所选牌无法压过上一手'};
  }

  const remaining=removeCards(player.hand,cards);
  if(!remaining) return {ok:false,error:'手牌校验失败'};

  player.hand=remaining;
  game.lastPlay=analyzed;
  game.lastCards=cards;
  game.lastPlayRole=role;

  if(!finishIfWon(game)){
    game.turn=otherRole(role);
  }

  return {ok:true,play:analyzed};
}

export function passTurn(game,role){
  if(game.phase!=='playing') return {ok:false,error:'当前不是出牌阶段'};
  if(game.turn!==role) return {ok:false,error:'还没轮到你'};
  if(!game.lastPlay || !game.lastPlayRole) return {ok:false,error:'你是本轮先手，不能不要'};
  if(game.lastPlayRole===role) return {ok:false,error:'你是本轮先手，不能不要'};

  const leader=game.lastPlayRole;
  game.lastPlay=null;
  game.lastCards=[];
  game.lastPlayRole=null;
  game.turn=leader;
  return {ok:true};
}
