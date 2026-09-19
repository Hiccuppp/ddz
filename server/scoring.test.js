import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './game.js';
import {currentMultiplier,chooseDouble,applyBombMultiplier,settleRound,startDoubling} from './scoring.js';

function gameWithPlayers(){
  const game=createGame();
  game.players={
    admin:{id:'a',hand:[]},
    player:{id:'p',hand:[]}
  };
  game.landlord='admin';
  game.farmer='player';
  return game;
}

test('rob, player doubles and bombs multiply cumulatively',()=>{
  const game=gameWithPlayers();
  game.robMultiplier=4; // two successful robs
  startDoubling(game);

  assert.equal(currentMultiplier(game),4);

  assert.equal(chooseDouble(game,'admin',true).ok,true);
  assert.equal(currentMultiplier(game),8);

  assert.equal(chooseDouble(game,'player',true).ok,true);
  assert.equal(currentMultiplier(game),16);

  applyBombMultiplier(game,{type:'bomb'});
  assert.equal(currentMultiplier(game),32);

  applyBombMultiplier(game,{type:'rocket'});
  assert.equal(currentMultiplier(game),64);
  assert.equal(game.bombCount,2);
});

test('round settlement is zero sum and uses final multiplier',()=>{
  const game=gameWithPlayers();
  game.robMultiplier=2;
  startDoubling(game);
  chooseDouble(game,'admin',true);
  chooseDouble(game,'player',false);
  applyBombMultiplier(game,{type:'bomb'});

  const result=settleRound(game,'admin');
  assert.equal(result.ok,true);
  assert.equal(result.points,8);
  assert.deepEqual(game.scores,{admin:8,player:-8});
  assert.deepEqual(game.roundDelta,{admin:8,player:-8});
  assert.equal(game.completedRounds,1);
  assert.equal(game.phase,'finished');
});

test('eighth settled round ends the match',()=>{
  const game=gameWithPlayers();
  game.completedRounds=7;
  game.roundNumber=8;
  game.robMultiplier=1;
  startDoubling(game);
  chooseDouble(game,'admin',false);
  chooseDouble(game,'player',false);

  settleRound(game,'player');
  assert.equal(game.completedRounds,8);
  assert.equal(game.phase,'match_finished');
  assert.equal(game.matchEnded,true);
  assert.equal(game.matchWinner,'player');
});
