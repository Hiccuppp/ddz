export function startRob(game){
 game.phase='rob';
 game.robCount=0;
 game.robPlayer=game.landlord || game.callPlayer;
}

export function rob(game,player,accept){
 if(game.phase!=='rob') return;
 if(accept){
  game.landlord=player;
  game.robCount++;
 }

 game.robCount++;

 if(game.robCount>=4){
  finishRob(game);
  return;
 }

 game.robPlayer = game.robPlayer==='admin'?'player':'admin';
}

export function finishRob(game){
 if(!game.landlord){
  game.landlord=game.callPlayer;
 }
 game.phase='playing';
 game.turn=game.landlord;
}
