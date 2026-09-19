import {callLandlord} from './game.js';
import {rob} from './landlord.js';
import {playTurn,passTurn} from './engine.js';

export function registerGameEvents(socket,game,broadcast){
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
}
