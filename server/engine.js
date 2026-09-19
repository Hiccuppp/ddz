import {analyze,canBeat,removeCards} from './play.js';
import {otherRole} from './game.js';
import {applyBombMultiplier,settleRound} from './scoring.js';

function finishIfWon(game){
  const landlord=game.landlord;
  if(!landlord) return false;

  if(game.players[landlord].hand.length===0){
    settleRound(game,landlord);
    return true;
  }

  const farmer=otherRole(landlord);
  const farmerCount=game.players[farmer].hand.length;
  if(farmerCount===0 || farmerCount<=game.robCount){
    settleRound(game,farmer);
    return true;
  }

  return false;
}

function canonicalCards(hand,requested){
  if(!Array.isArray(requested) || requested.length===0) return null;
  const ids=requested.map(card=>typeof card==='string' ? card : card?.id);
  if(ids.some(id=>!id) || new Set(ids).size!==ids.length) return null;

  const byId=new Map(hand.map(card=>[card.id,card]));
  const cards=ids.map(id=>byId.get(id));
  if(cards.some(card=>!card)) return null;
  return cards;
}

export function playTurn(game,role,requestedCards){
  const player=game.players[role];
  if(!player) return {ok:false,error:'玩家不存在'};
  if(game.phase!=='playing') return {ok:false,error:'当前不是出牌阶段'};
  if(game.turn!==role) return {ok:false,error:'还没轮到你'};

  const cards=canonicalCards(player.hand,requestedCards);
  if(!cards) return {ok:false,error:'手牌校验失败'};

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

  applyBombMultiplier(game,analyzed);

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
