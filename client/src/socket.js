import {io} from 'socket.io-client';

export const socket=io({
  transports:['websocket','polling']
});

export function join(role,key){
  socket.emit('join',{role,key});
}

export function callLandlord(value){
  socket.emit('call',Boolean(value));
}

export function robLandlord(value){
  socket.emit('rob',Boolean(value));
}

export function playCards(cards){
  socket.emit('play',cards);
}

export function passTurn(){
  socket.emit('pass');
}
