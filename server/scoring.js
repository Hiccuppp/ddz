function otherRole(role){
  return role==='admin' ? 'player' : 'admin';
}

export function currentMultiplier(game){
  const landlordFactor=game.doubleChoices?.[game.landlord] ? 2 : 1;
  const farmer=game.landlord ? otherRole(game.landlord) : null;
  const farmerFactor=farmer && game.doubleChoices?.[farmer] ? 2 : 1;
  return (game.robMultiplier || 1) * landlordFactor * farmerFactor;
}

export function startDoubling(game){
  const farmer=otherRole(game.landlord);
  game.phase='double';
  game.doubleChoices={admin:null,player:null};
  game.doublePlayer=game.landlord;
  game.turn=game.landlord;
  game.multiplier=currentMultiplier(game);
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
  game.multiplier=currentMultiplier(game);

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

export function settleRound(game,winner){
  if(game.roundSettled) return;
  const loser=otherRole(winner);
  const points=(game.baseScore || 1) * currentMultiplier(game);

  game.multiplier=currentMultiplier(game);
  game.roundScore=points;
  game.roundDelta={admin:0,player:0};
  game.roundDelta[winner]=points;
  game.roundDelta[loser]=-points;

  game.players[winner].score=(game.players[winner].score || 0)+points;
  game.players[loser].score=(game.players[loser].score || 0)-points;
  game.roundSettled=true;
}
