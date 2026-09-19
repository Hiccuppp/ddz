function otherRole(role){
  return role==='admin' ? 'player' : 'admin';
}

export function currentMultiplier(game){
  const landlordFactor=game.doubleChoices?.[game.landlord] ? 2 : 1;
  const farmer=game.landlord ? otherRole(game.landlord) : null;
  const farmerFactor=farmer && game.doubleChoices?.[farmer] ? 2 : 1;
  return (game.robMultiplier || 1) * (game.bombMultiplier || 1) * landlordFactor * farmerFactor;
}

export function refreshMultiplier(game){
  game.multiplier=currentMultiplier(game);
  return game.multiplier;
}

export function startDoubling(game){
  const farmer=otherRole(game.landlord);
  game.phase='double';
  game.doubleChoices={admin:null,player:null};
  game.doublePlayer=game.landlord;
  game.turn=game.landlord;
  game.bombCount=0;
  game.bombMultiplier=1;
  refreshMultiplier(game);
  game.roundScore=0;
  game.roundDelta={admin:0,player:0};
  game.roundSettled=false;
  game.farmer=farmer;
}

export function chooseDouble(game,role,accept){
  if(game.phase!=='double' || game.doublePlayer!==role || game.turn!==role){
    return {ok:false,error:'现在不能加倍'};
  }

  game.doubleChoices[role]=Boolean(accept);
  refreshMultiplier(game);

  const farmer=otherRole(game.landlord);
  if(role===game.landlord){
    game.doublePlayer=farmer;
    game.turn=farmer;
    return {ok:true,finished:false};
  }

  game.doublePlayer=null;
  game.phase='playing';
  game.turn=game.landlord;
  game.lastPlay=null;
  game.lastCards=[];
  game.lastPlayRole=null;
  return {ok:true,finished:true};
}

export function applyBombMultiplier(game,play){
  if(!play || !['bomb','rocket'].includes(play.type)) return false;
  game.bombCount=(game.bombCount||0)+1;
  game.bombMultiplier=(game.bombMultiplier||1)*2;
  refreshMultiplier(game);
  return true;
}

export function settleRound(game,winner){
  if(game.roundSettled) return {ok:false,error:'本局已经结算'};
  if(!['admin','player'].includes(winner)) return {ok:false,error:'无效赢家'};

  const loser=otherRole(winner);
  const points=(game.baseScore || 1) * currentMultiplier(game);

  refreshMultiplier(game);
  game.roundScore=points;
  game.roundDelta={admin:0,player:0};
  game.roundDelta[winner]=points;
  game.roundDelta[loser]=-points;

  game.scores[winner]=(game.scores[winner]||0)+points;
  game.scores[loser]=(game.scores[loser]||0)-points;
  game.roundSettled=true;
  game.winner=winner;
  game.turn=null;
  game.completedRounds=(game.completedRounds||0)+1;

  if(game.completedRounds>=game.maxRounds){
    endMatch(game);
  }else{
    game.phase='finished';
  }

  return {ok:true,points};
}

export function setScores(game,scores){
  const admin=Number(scores?.admin);
  const player=Number(scores?.player);
  if(!Number.isFinite(admin) || !Number.isFinite(player)) return {ok:false,error:'分数必须是数字'};
  if(!Number.isInteger(admin) || !Number.isInteger(player)) return {ok:false,error:'分数必须是整数'};
  if(Math.abs(admin)>1000000 || Math.abs(player)>1000000) return {ok:false,error:'分数超出允许范围'};

  game.scores={admin,player};
  if(game.matchEnded) updateMatchWinner(game);
  return {ok:true};
}

export function updateMatchWinner(game){
  if(game.scores.admin>game.scores.player) game.matchWinner='admin';
  else if(game.scores.player>game.scores.admin) game.matchWinner='player';
  else game.matchWinner=null;
}

export function endMatch(game){
  game.matchEnded=true;
  game.phase='match_finished';
  game.turn=null;
  game.doublePlayer=null;
  updateMatchWinner(game);
  return {ok:true};
}
