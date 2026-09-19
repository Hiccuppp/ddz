import {RANK_VALUES} from './cards.js';
import {deal,resetMatch} from './game.js';
import {endMatch,setScores,settleRound} from './scoring.js';

const NORMAL_RANKS=new Set(['3','4','5','6','7','8','9','10','J','Q','K','A','2']);
const SUITS=new Set(['♠','♥','♣','♦']);
const JOKERS=new Set(['SJ','BJ']);

function requireAdmin(role){
  return role==='admin' ? null : {ok:false,error:'无管理员权限'};
}

export function replaceOpponentCard(game,role,targetCardId,replacement={}){
  const denied=requireAdmin(role);
  if(denied) return denied;
  if(!game.players.player) return {ok:false,error:'普通玩家未连接'};
  if(['waiting','finished','match_finished'].includes(game.phase)) return {ok:false,error:'当前阶段不能改牌'};

  const index=game.players.player.hand.findIndex(card=>card.id===targetCardId);
  if(index<0) return {ok:false,error:'目标牌不存在'};

  const rank=String(replacement.rank||'');
  let suit='';

  if(JOKERS.has(rank)){
    suit='';
  }else{
    suit=String(replacement.suit||'');
    if(!NORMAL_RANKS.has(rank) || !SUITS.has(suit)){
      return {ok:false,error:'替换牌无效'};
    }
  }

  game.adminMutationSeq=(game.adminMutationSeq||0)+1;
  const card={
    id:`ADMIN-${game.adminMutationSeq}-${rank}-${suit || 'J'}`,
    rank,
    suit,
    value:RANK_VALUES[rank]
  };

  game.players.player.hand.splice(index,1,card);
  return {ok:true,card};
}

export function adminSetScores(game,role,scores){
  const denied=requireAdmin(role);
  if(denied) return denied;
  return setScores(game,scores);
}

export function adminForceRound(game,role,winner){
  const denied=requireAdmin(role);
  if(denied) return denied;
  if(game.matchEnded) return {ok:false,error:'整场已经结束'};
  if(game.roundSettled) return {ok:false,error:'本局已经结算'};
  if(!game.players.admin || !game.players.player) return {ok:false,error:'玩家未齐'};

  const result=settleRound(game,winner);
  if(result.ok) game.turn=null;
  return result;
}

export function adminNextRound(game,role){
  const denied=requireAdmin(role);
  if(denied) return denied;
  if(game.matchEnded) return {ok:false,error:'整场已经结束'};
  if(game.phase!=='finished' || !game.roundSettled) return {ok:false,error:'当前不能开始下一局'};
  if(!game.players.admin || !game.players.player) return {ok:false,error:'玩家未齐'};

  deal(game);
  return {ok:true};
}

export function adminEndMatch(game,role,{winner=null,settleCurrent=false}={}){
  const denied=requireAdmin(role);
  if(denied) return denied;

  if(settleCurrent && !game.roundSettled){
    if(!['admin','player'].includes(winner)) return {ok:false,error:'请选择本局赢家'};
    const result=settleRound(game,winner);
    if(!result.ok) return result;
  }

  endMatch(game);
  return {ok:true};
}

export function adminResetMatch(game,role){
  const denied=requireAdmin(role);
  if(denied) return denied;
  resetMatch(game);
  return {ok:true};
}
