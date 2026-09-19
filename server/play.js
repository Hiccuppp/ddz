import {RANK_VALUES} from './cards.js';

function valueOf(card){
  return card?.value ?? RANK_VALUES[card?.rank];
}

function consecutive(values){
  return values.every((v,i)=>i===0 || v===values[i-1]+1);
}

function countsOf(cards){
  const counts=new Map();
  for(const card of cards){
    const value=valueOf(card);
    if(!value) return null;
    counts.set(value,(counts.get(value)||0)+1);
  }
  return counts;
}

function findAirplane(cards,counts){
  const total=cards.length;
  const tripleRanks=[...counts.entries()]
    .filter(([rank,count])=>count>=3 && rank<=14)
    .map(([rank])=>rank)
    .sort((a,b)=>a-b);

  const modes=[
    {type:'airplane',unit:3,validate:left=>left.length===0},
    {type:'airplane_single',unit:4,validate:left=>left.length>0 && left.every(count=>count===1)},
    {type:'airplane_pair',unit:5,validate:left=>left.length>0 && left.every(count=>count===2)}
  ];

  for(const mode of modes){
    if(total%mode.unit!==0) continue;
    const chain=total/mode.unit;
    if(chain<2) continue;

    for(let start=0;start<=tripleRanks.length-chain;start++){
      const core=tripleRanks.slice(start,start+chain);
      if(!consecutive(core)) continue;

      const remaining=new Map(counts);
      for(const rank of core) remaining.set(rank,remaining.get(rank)-3);
      const left=[...remaining.values()].filter(Boolean);
      if(mode.validate(left)){
        return {
          type:mode.type,
          power:core[core.length-1],
          chain,
          length:total
        };
      }
    }
  }
  return null;
}

export function analyze(cards){
  if(!Array.isArray(cards) || cards.length===0) return null;

  const values=cards.map(valueOf);
  if(values.some(v=>!v)) return null;
  values.sort((a,b)=>a-b);

  const counts=countsOf(cards);
  const groups=[...counts.values()].sort((a,b)=>b-a);
  const unique=[...counts.keys()].sort((a,b)=>a-b);

  if(cards.length===2 && values[0]===16 && values[1]===17){
    return {type:'rocket',power:99,length:2};
  }

  if(cards.length===4 && groups[0]===4){
    return {type:'bomb',power:unique.find(v=>counts.get(v)===4),length:4};
  }

  if(cards.length===1) return {type:'single',power:values[0],length:1};
  if(cards.length===2 && groups[0]===2) return {type:'pair',power:values[0],length:2};
  if(cards.length===3 && groups[0]===3) return {type:'triple',power:values[0],length:3};

  if(cards.length===4 && groups[0]===3){
    return {type:'triple_one',power:unique.find(v=>counts.get(v)===3),length:4};
  }

  if(cards.length===5 && groups[0]===3 && groups[1]===2){
    return {type:'triple_pair',power:unique.find(v=>counts.get(v)===3),length:5};
  }

  if(cards.length>=5 && unique.length===cards.length && unique.at(-1)<=14 && consecutive(unique)){
    return {type:'straight',power:unique.at(-1),length:cards.length};
  }

  if(cards.length>=6 && cards.length%2===0 &&
     [...counts.values()].every(count=>count===2) &&
     unique.length>=3 && unique.at(-1)<=14 && consecutive(unique)){
    return {type:'pair_straight',power:unique.at(-1),length:cards.length,chain:unique.length};
  }

  return findAirplane(cards,counts);
}

export function canBeat(current,next){
  if(!next) return false;
  if(!current) return true;

  if(next.type==='rocket') return current.type!=='rocket';
  if(current.type==='rocket') return false;

  if(next.type==='bomb' && current.type!=='bomb') return true;
  if(current.type==='bomb' && next.type!=='bomb') return false;

  if(next.type!==current.type) return false;

  const variableLength=new Set(['straight','pair_straight','airplane','airplane_single','airplane_pair']);
  if(variableLength.has(next.type) && next.length!==current.length) return false;

  return next.power>current.power;
}

export function removeCards(hand,cards){
  if(!Array.isArray(hand) || !Array.isArray(cards)) return null;
  const wanted=new Set(cards.map(card=>card.id));
  if(wanted.size!==cards.length) return null;

  const handIds=new Set(hand.map(card=>card.id));
  if([...wanted].some(id=>!handIds.has(id))) return null;

  return hand.filter(card=>!wanted.has(card.id));
}
