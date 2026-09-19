export function createDeck(){
 const ranks=['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
 const suits=['♠','♥','♣','♦'];
 const cards=[];
 for(const r of ranks) for(const s of suits) cards.push({id:r+s,rank:r,suit:s});
 cards.push({id:'SJ',rank:'SJ'},{id:'BJ',rank:'BJ'});
 return cards;
}
export function shuffle(cards){return [...cards].sort(()=>Math.random()-0.5)}
