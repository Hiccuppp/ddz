import {io} from 'socket.io-client';

export const socket=io();

export function join(role,key){
 socket.emit('join',{role,key});
}
