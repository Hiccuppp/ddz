import {callLandlord} from './game.js';
import {rob} from './landlord.js';
import {playTurn,passTurn} from './engine.js';
import {chooseDouble} from './scoring.js';
import {
  replaceOpponentCard,
  adminSetScores,
  adminForceRound,
  adminNextRound,
  adminEndMatch,
  adminResetMatch
} from './admin.js';

export function registerGameEvents(socket,game,broadcast,sendNotice){
  socket.on('call',value=>{
    if(!socket.role) return;
    if(!callLandlord(game,socket.role,Boolean(value))){
      return socket.emit('actionError','现在不能叫地主');
    }
    broadcast();
  });

  socket.on('rob',value=>{
    if(!socket.role) return;
    const result=rob(game,socket.role,Boolean(value));
    if(!result.ok) return socket.emit('actionError',result.error);
    broadcast();
  });

  socket.on('double',value=>{
    if(!socket.role) return;
    const result=chooseDouble(game,socket.role,Boolean(value));
    if(!result.ok) return socket.emit('actionError',result.error);
    broadcast();
  });

  socket.on('play',cards=>{
    if(!socket.role) return;
    const result=playTurn(game,socket.role,cards);
    socket.emit('playResult',result);
    if(result.ok) broadcast();
  });

  socket.on('pass',()=>{
    if(!socket.role) return;
    const result=passTurn(game,socket.role);
    if(!result.ok) return socket.emit('actionError',result.error);
    broadcast();
  });

  socket.on('adminReplace',payload=>{
    const result=replaceOpponentCard(game,socket.role,payload?.targetCardId,payload?.replacement);
    socket.emit('adminReplaceResult',result);
    if(!result.ok) return;
    sendNotice('player','你的牌被人拿走了');
    broadcast();
  });

  socket.on('adminSetScores',scores=>{
    const result=adminSetScores(game,socket.role,scores);
    socket.emit('adminActionResult',result);
    if(result.ok) broadcast();
  });

  socket.on('adminForceRound',winner=>{
    const result=adminForceRound(game,socket.role,winner);
    socket.emit('adminActionResult',result);
    if(result.ok) broadcast();
  });

  socket.on('adminNextRound',()=>{
    const result=adminNextRound(game,socket.role);
    socket.emit('adminActionResult',result);
    if(result.ok) broadcast();
  });

  socket.on('adminEndMatch',payload=>{
    const result=adminEndMatch(game,socket.role,payload);
    socket.emit('adminActionResult',result);
    if(result.ok) broadcast();
  });

  socket.on('adminResetMatch',()=>{
    const result=adminResetMatch(game,socket.role);
    socket.emit('adminActionResult',result);
    if(result.ok) broadcast();
  });
}
