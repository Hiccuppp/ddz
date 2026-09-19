import {playTurn} from './engine.js';

export function registerGameEvents(io,socket,game){
  socket.on('rob',value=>{
    if(game.phase!=='rob') return;
    game.robCount++;
    if(value) game.landlord=socket.role;
    io.emit('state',game);
  });

  socket.on('play',cards=>{
    const result=playTurn(game,socket.role,cards);
    socket.emit('playResult',result);
    if(result.ok) io.emit('state',game);
  });

  socket.on('pass',()=>{
    game.turn=Object.keys(game.players).find(v=>v!==socket.role);
    io.emit('state',game);
  });
}
