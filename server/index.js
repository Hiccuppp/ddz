import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import dotenv from 'dotenv';
import {createGame,deal} from './game.js';

dotenv.config();
const app=express();
const http=createServer(app);
const io=new Server(http,{cors:{origin:'*'}});
const game=createGame();

io.on('connection',socket=>{
 socket.on('join',({role,key})=>{
  if(role==='admin' && key!==process.env.ADMIN_KEY) return socket.disconnect();
  if(game.players[role]) return socket.emit('error','room full');
  game.players[role]={id:socket.id,hand:[]};
  socket.role=role;
  if(Object.keys(game.players).length===2){deal(game);io.emit('state',game);}
 });
 socket.on('play',cards=>{io.emit('state',game);});
 socket.on('disconnect',()=>{if(socket.role) delete game.players[socket.role];});
});

http.listen(process.env.PORT||3000);
