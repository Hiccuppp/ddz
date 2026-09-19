import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import dotenv from 'dotenv';
import {createGame,deal,resetToWaiting,otherRole} from './game.js';
import {registerGameEvents} from './events.js';

dotenv.config();

const app=express();
const http=createServer(app);
const io=new Server(http,{cors:{origin:'*'}});
const game=createGame();

app.get('/health',(_req,res)=>res.json({ok:true,phase:game.phase}));

function stateFor(role){
  const me=game.players[role];
  const opponentRole=otherRole(role);
  const opponent=game.players[opponentRole];
  const revealBottom=['playing','finished'].includes(game.phase);
  return {
    role,
    phase:game.phase,
    players:{
      admin:{count:game.players.admin?.hand.length ?? 0,connected:Boolean(game.players.admin)},
      player:{count:game.players.player?.hand.length ?? 0,connected:Boolean(game.players.player)}
    },
    hand:me?.hand ?? [],
    opponentHand:role==='admin' ? (opponent?.hand ?? []) : undefined,
    flipCard:game.flipCard,
    bottom:revealBottom ? game.bottom : [],
    landlord:game.landlord,
    callPlayer:game.callPlayer,
    robPlayer:game.robPlayer,
    robCount:game.robCount,
    robRounds:game.robRounds,
    turn:game.turn,
    lastPlay:game.lastPlay,
    lastCards:game.lastCards,
    lastPlayRole:game.lastPlayRole,
    winner:game.winner
  };
}

function broadcast(){
  for(const role of ['admin','player']){
    const player=game.players[role];
    if(player) io.to(player.id).emit('state',stateFor(role));
  }
}

io.on('connection',socket=>{
  socket.on('join',({role,key}={})=>{
    if(!['admin','player'].includes(role)) return socket.emit('joinError','无效玩家类型');
    if(role==='admin' && key!==process.env.ADMIN_KEY) return socket.emit('joinError','管理员密码错误');
    if(socket.role) return;
    if(game.players[role]) return socket.emit('joinError',role==='admin'?'管理员位置已占用':'房间已满');
    if(Object.keys(game.players).length>=2) return socket.emit('joinError','房间已满');

    game.players[role]={id:socket.id,hand:[]};
    socket.role=role;
    if(game.players.admin && game.players.player) deal(game);
    broadcast();
  });

  registerGameEvents(socket,game,broadcast,(role,message)=>{
    const target=game.players[role];
    if(target) io.to(target.id).emit('notice',message);
  });

  socket.on('disconnect',()=>{
    if(!socket.role) return;
    delete game.players[socket.role];
    resetToWaiting(game);
    broadcast();
  });
});

const port=Number(process.env.PORT)||3000;
http.listen(port,()=>console.log(`DDZ server listening on :${port}`));
