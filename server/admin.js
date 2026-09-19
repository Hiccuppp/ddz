import {RANK_VALUES} from './cards.js';

const NORMAL_RANKS=new Set(['3','4','5','6','7','8','9','10','J','Q','K','A','2']);
const SUITS=new Set(['♠','♥','♣','♦']);
const JOKERS=new Set(['SJ','BJ']);

export function replaceOpponentCard(game,role,targetCardId,replacement={}){
  if(role!=='admin') return {ok:false,error:'无管理员权限'};
  if(!game.players.player) return {ok:false,error:'普通玩家未连接'};
  if(['waiting','finished'].includes(game.phase)) return {ok:false,error:'当前阶段不能改牌'};

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
