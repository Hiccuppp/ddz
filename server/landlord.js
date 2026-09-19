import {otherRole} from './game.js';
import {startDoubling} from './scoring.js';

export function rob(game,player,accept){
  if(game.phase!=='rob' || game.robPlayer!==player || game.turn!==player){
    return {ok:false,error:'现在不能抢地主'};
  }

  game.robRounds++;

  if(accept){
    game.landlord=player;
    game.robCount++;
    game.robMultiplier*=2;
    game.multiplier=game.robMultiplier;
    game.robPassStreak=0;
  }else{
    game.robPassStreak++;
  }

  if(game.robRounds>=4 || game.robPassStreak>=2){
    finishRob(game);
    return {ok:true,finished:true};
  }

  game.robPlayer=otherRole(player);
  game.turn=game.robPlayer;
  return {ok:true,finished:false};
}

export function finishRob(game){
  if(!game.landlord) game.landlord=game.callPlayer;
  game.farmer=otherRole(game.landlord);

  const landlord=game.players[game.landlord];
  const owned=new Set(landlord.hand.map(card=>card.id));
  for(const card of game.bottom){
    if(!owned.has(card.id)) landlord.hand.push(card);
  }

  game.robPlayer=null;
  game.lastPlay=null;
  game.lastCards=[];
  game.lastPlayRole=null;
  startDoubling(game);
}
