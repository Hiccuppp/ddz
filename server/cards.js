export const RANK_VALUES = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
  'SJ': 16, 'BJ': 17
};

export function createDeck(){
  const ranks=['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
  const suits=['♠','♥','♣','♦'];
  const cards=[];
  for(const rank of ranks){
    for(const suit of suits){
      cards.push({id:`${rank}${suit}`,rank,suit,value:RANK_VALUES[rank]});
    }
  }
  cards.push(
    {id:'SJ',rank:'SJ',suit:'',value:RANK_VALUES.SJ},
    {id:'BJ',rank:'BJ',suit:'',value:RANK_VALUES.BJ}
  );
  return cards;
}

export function shuffle(cards){
  const result=[...cards];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
