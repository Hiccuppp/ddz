import {io} from 'socket.io-client';

export const socket=io({
  transports:['websocket','polling']
});

export function join(role,key){ socket.emit('join',{role,key}); }
export function callLandlord(value){ socket.emit('call',Boolean(value)); }
export function robLandlord(value){ socket.emit('rob',Boolean(value)); }
export function chooseDouble(value){ socket.emit('double',Boolean(value)); }
export function playCards(cards){ socket.emit('play',cards); }
export function passTurn(){ socket.emit('pass'); }

export function replaceCard(targetCardId,rank,suit){
  socket.emit('adminReplace',{targetCardId,replacement:{rank,suit}});
}
export function setScores(admin,player){ socket.emit('adminSetScores',{admin,player}); }
export function forceRound(winner){ socket.emit('adminForceRound',winner); }
export function nextRound(){ socket.emit('adminNextRound'); }
export function endMatch(payload={}){ socket.emit('adminEndMatch',payload); }
export function resetMatch(){ socket.emit('adminResetMatch'); }
