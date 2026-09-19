import test from 'node:test';
import assert from 'node:assert/strict';
import {RANK_VALUES} from './cards.js';
import {analyze,canBeat} from './play.js';
import {playTurn} from './engine.js';

const suits=['♠','♥','♣','♦'];
function cards(spec){
  const used={};
  return spec.map(rank=>{
    used[rank]=(used[rank]||0)+1;
    const suit=rank==='SJ'||rank==='BJ' ? '' : suits[used[rank]-1];
    return {id:rank==='SJ'||rank==='BJ'?rank:`${rank}${suit}`,rank,suit,value:RANK_VALUES[rank]};
  });
}

test('recognizes requested custom hand types',()=>{
  assert.equal(analyze(cards(['A'])).type,'single');
  assert.equal(analyze(cards(['7','7'])).type,'pair');
  assert.equal(analyze(cards(['K','K','K'])).type,'triple');
  assert.equal(analyze(cards(['8','8','8','3'])).type,'triple_one');
  assert.equal(analyze(cards(['8','8','8','5','5'])).type,'triple_pair');
  assert.equal(analyze(cards(['3','4','5','6','7'])).type,'straight');
  assert.equal(analyze(cards(['3','3','4','4','5','5'])).type,'pair_straight');
  assert.equal(analyze(cards(['3','3','3','4','4','4'])).type,'airplane');
  assert.equal(analyze(cards(['3','3','3','4','4','4','5','5','6','6'])).type,'airplane_pair');
  assert.equal(analyze(cards(['A','A','A','A'])).type,'bomb');
  assert.equal(analyze(cards(['SJ','BJ'])).type,'rocket');
});

test('rejects straights containing 2',()=>{
  assert.equal(analyze(cards(['J','Q','K','A','2'])),null);
});

test('bomb and rocket comparison follows rules',()=>{
  const single=analyze(cards(['A']));
  const bomb=analyze(cards(['3','3','3','3']));
  const biggerBomb=analyze(cards(['4','4','4','4']));
  const rocket=analyze(cards(['SJ','BJ']));
  assert.equal(canBeat(single,bomb),true);
  assert.equal(canBeat(bomb,biggerBomb),true);
  assert.equal(canBeat(biggerBomb,rocket),true);
  assert.equal(canBeat(rocket,biggerBomb),false);
});

test('server analyzes canonical cards instead of forged client values',()=>{
  const real=cards(['3'])[0];
  const game={
    phase:'playing',
    landlord:'admin',
    robCount:0,
    turn:'admin',
    lastPlay:null,
    lastCards:[],
    lastPlayRole:null,
    winner:null,
    players:{
      admin:{hand:[real,cards(['4'])[0]]},
      player:{hand:cards(['5','6'])}
    }
  };

  const forged={id:real.id,rank:'BJ',value:17};
  const result=playTurn(game,'admin',[forged]);
  assert.equal(result.ok,true);
  assert.equal(result.play.power,3);
  assert.equal(game.players.admin.hand.length,1);
});
