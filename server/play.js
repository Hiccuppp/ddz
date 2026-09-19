// 斗地主出牌核心

function rank(card){
 return card.value;
}

export function analyze(cards){
 if(!cards || cards.length===0) return null;
 const values=cards.map(rank).sort((a,b)=>a-b);
 const count={};
 values.forEach(v=>count[v]=(count[v]||0)+1);
 const groups=Object.values(count).sort((a,b)=>b-a);

 if(cards.length===2 && values.includes(14) && values.includes(15)){
  return {type:'rocket',power:99};
 }

 if(groups[0]===4 && cards.length===4){
  return {type:'bomb',power:values[0]};
 }

 if(cards.length===1) return {type:'single',power:values[0]};
 if(cards.length===2 && groups[0]===2) return {type:'pair',power:values[0]};
 if(cards.length===3 && groups[0]===3) return {type:'triple',power:values[0]};

 if(groups[0]===3 && cards.length===4)
  return {type:'triple_one',power:values.find(v=>count[v]===3)};

 if(groups[0]===3 && groups[1]===2)
  return {type:'triple_pair',power:values.find(v=>count[v]===3)};

 if(cards.length>=5){
  const unique=[...new Set(values)];
  const straight=unique.length===cards.length &&
   unique.every((v,i)=>i===0||v===unique[i-1]+1) &&
   !unique.includes(2) && !unique.includes(14) && !unique.includes(15);
  if(straight) return {type:'straight',power:unique[unique.length-1]};
 }

 return null;
}

export function canBeat(current,next){
 if(!next) return false;
 if(!current) return true;
 if(next.type==='rocket') return true;
 if(current.type==='rocket') return false;
 if(next.type==='bomb' && current.type!=='bomb') return true;
 if(next.type!==current.type) return false;
 return next.power>current.power;
}

export function removeCards(hand,cards){
 return hand.filter(c=>!cards.find(x=>x.id===c.id));
}
