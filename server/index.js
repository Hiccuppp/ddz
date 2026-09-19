import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import dotenv from 'dotenv';
import {createGame,deal,callLandlord} from './game.js';

dotenv.config();
const app=express();
const http=createServer(app);
const io=new Server(http,{cors:{origin:'*'}});
const game=createGame();

function publicState(){
 return {
  phase:game.phase,
  players:Object.fromEntries(Object.entries(game.players).map(([k,v])=>[k,{count:v.hand.length}])) ,
  flipCard:game.flipCard,
  landlord:game.landlord,
  turn:game.turn,
  lastPlay:game.lastPlay
 };
}

io.on('connection',socket=>{
 socket.on('join',({role,key})=>{
  if(role==='admin' && key!==process.env.ADMIN_KEY) return socket.disconnect();
  if(!['admin','player'].includes(role)) return;
  if(game.players[role]) return socket.emit('error','room full');
  game.players[role]={id:socket.id,hand:[]};
  socket.role=role;
  socket.emit('state',game);
  if(Object.keys(game.players).length===2){deal(game);io.emit('state',publicState());}
 });

 socket.on('call',value=>{
  if(callLandlord(game,socket.role,value)) io.emit('state',publicState());
 });

 socket.on('disconnect',()=>{if(socket.role) delete game.players[socket.role];});
});

http.listen(process.env.PORT||3000);
