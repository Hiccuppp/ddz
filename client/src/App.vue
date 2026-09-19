<template>
  <div class="game">
    <div v-if="portrait" class="rotate">请横屏游玩</div>

    <template v-else>
      <header class="topbar">
        <span>第 {{ state?.roundNumber || 1 }}/{{ state?.maxRounds || 8 }} 局</span>
        <span class="scoreline">我 {{ myScore }} : {{ opponentScore }} 对手</span>
        <span>倍数 ×{{ state?.multiplier || 1 }}</span>
        <button v-if="role==='admin'" class="manage-button" @click="adminOpen=!adminOpen">管理</button>
      </header>

      <section class="opponent">
        <div class="player-title">
          对手 · {{ opponentCount }} 张
          <span v-if="state?.landlord===opponentRole" class="identity-tag">地主</span>
          <span v-else-if="state?.landlord" class="identity-tag farmer">农民</span>
          <span v-if="state?.turn === opponentRole" class="turn-tag">行动中</span>
        </div>
        <div class="backs">
          <span v-for="n in Math.min(opponentCount,12)" :key="n" class="back">🂠</span>
        </div>
      </section>

      <section class="table-center">
        <div class="info-row">
          <div class="info-box">
            <span>翻牌</span>
            <Card v-if="state?.flipCard" :card="state.flipCard" compact />
            <b v-else>-</b>
          </div>

          <div class="play-area">
            <div v-if="state?.lastCards?.length" class="last-play">
              <span>{{ roleName(state.lastPlayRole) }}：</span>
              <Card v-for="card in state.lastCards" :key="card.id" :card="card" compact />
            </div>
            <div v-else class="hint">{{ centerHint }}</div>
          </div>

          <div class="info-box multiplier-box">
            <span>底牌</span>
            <div class="bottom-cards">
              <Card v-for="card in state?.bottom || []" :key="card.id" :card="card" compact />
              <b v-if="!state?.bottom?.length">?</b>
            </div>
            <small v-if="state?.bombCount">炸弹×{{ state.bombCount }}</small>
          </div>
        </div>

        <div class="message" :class="{error:isError}">{{ message }}</div>
      </section>

      <section v-if="role==='admin' && state?.opponentHand?.length" class="admin-peek">
        <span class="admin-label">对手真实手牌</span>
        <Card
          v-for="card in sortedOpponentHand"
          :key="card.id"
          :card="card"
          compact
          :selected="adminTargetId===card.id"
          @click="adminTargetId=card.id"
        />
        <select v-model="replaceRank">
          <option v-for="rank in replaceRanks" :key="rank" :value="rank">{{ rankLabel(rank) }}</option>
        </select>
        <select v-if="!['SJ','BJ'].includes(replaceRank)" v-model="replaceSuit">
          <option v-for="suit in suits" :key="suit" :value="suit">{{ suit }}</option>
        </select>
        <button :disabled="!adminTargetId" @click="doReplace">替换</button>
      </section>

      <section class="my-area">
        <div class="player-title">
          我 · {{ sortedHand.length }} 张
          <span v-if="state?.landlord===role" class="identity-tag">地主</span>
          <span v-else-if="state?.landlord" class="identity-tag farmer">农民</span>
          <span v-if="state?.turn === role" class="turn-tag">轮到你</span>
        </div>

        <div class="hand-row">
          <Card
            v-for="(card,index) in sortedHand"
            :key="card.id"
            :card="card"
            :data-card-index="index"
            :selected="selectedIds.includes(card.id)"
            @pointerdown.prevent="startDrag(index,$event)"
          />
        </div>
      </section>

      <footer class="actions">
        <template v-if="state?.phase==='call' && state.turn===role">
          <button class="primary" @click="call(true)">叫地主</button>
          <button @click="call(false)">不叫</button>
        </template>

        <template v-else-if="state?.phase==='rob' && state.turn===role">
          <button class="primary" @click="rob(true)">抢地主</button>
          <button @click="rob(false)">不抢</button>
        </template>

        <template v-else-if="state?.phase==='double' && state.turn===role">
          <button class="primary" @click="doubleChoice(true)">加倍</button>
          <button @click="doubleChoice(false)">不加倍</button>
        </template>

        <template v-else-if="state?.phase==='playing' && state.turn===role">
          <button class="primary" :disabled="selectedIds.length===0" @click="playSelected">出牌</button>
          <button :disabled="!state.lastPlay" @click="pass">不要</button>
        </template>

        <div v-else-if="state?.phase==='finished'" class="winner">
          {{ roundResultText }}
        </div>

        <div v-else-if="state?.phase==='match_finished'" class="winner">
          {{ matchResultText }}
        </div>

        <div v-else class="waiting-action">{{ waitingText }}</div>
      </footer>

      <aside v-if="role==='admin' && adminOpen" class="admin-drawer">
        <div class="drawer-title">
          <b>管理员控制</b>
          <button @click="adminOpen=false">×</button>
        </div>

        <div class="drawer-section">
          <label>管理员分数 <input v-model.number="scoreAdminInput" type="number"></label>
          <label>普通玩家分数 <input v-model.number="scorePlayerInput" type="number"></label>
          <button @click="saveScores">修改记分板</button>
        </div>

        <div class="drawer-section compact-actions">
          <button @click="forceRoundWin('admin')">强制本局管理员胜</button>
          <button @click="forceRoundWin('player')">强制本局普通玩家胜</button>
          <button v-if="state?.phase==='finished'" class="primary" @click="startNextRound">开始下一局</button>
        </div>

        <div class="drawer-section danger">
          <button @click="settleAndEnd('admin')">管理员胜并结束整场</button>
          <button @click="settleAndEnd('player')">普通玩家胜并结束整场</button>
          <button @click="finishMatchOnly">按当前比分结束整场</button>
          <button @click="restartMatch">新开八局</button>
        </div>
      </aside>
    </template>
  </div>
</template>

<script setup>
import {computed,onBeforeUnmount,onMounted,ref} from 'vue'
import Card from './components/Card.vue'
import {
  socket,join,callLandlord,robLandlord,chooseDouble,playCards,passTurn,
  replaceCard,setScores,forceRound,nextRound,endMatch,resetMatch
} from './socket.js'

const state=ref(null)
const selectedIds=ref([])
const message=ref('正在连接服务器…')
const isError=ref(false)
const portrait=ref(window.innerHeight>window.innerWidth)

const adminOpen=ref(false)
const adminTargetId=ref(null)
const replaceRank=ref('3')
const replaceSuit=ref('♠')
const scoreAdminInput=ref(0)
const scorePlayerInput=ref(0)

const dragActive=ref(false)
const dragStart=ref(-1)
const dragEnd=ref(-1)
const dragMoved=ref(false)

const isAdmin=window.location.pathname.startsWith('/admin')
const role=isAdmin?'admin':'player'
const key=new URLSearchParams(window.location.search).get('key') || ''
const opponentRole=computed(()=>role==='admin'?'player':'admin')

const suits=['♠','♥','♣','♦']
const replaceRanks=['3','4','5','6','7','8','9','10','J','Q','K','A','2','SJ','BJ']
const rankOrder={3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,J:11,Q:12,K:13,A:14,2:15,SJ:16,BJ:17}
const byRank=(a,b)=>(rankOrder[b.rank]||b.value)-(rankOrder[a.rank]||a.value) || (a.suit||'').localeCompare(b.suit||'')

const sortedHand=computed(()=>[...(state.value?.hand||[])].sort(byRank))
const sortedOpponentHand=computed(()=>[...(state.value?.opponentHand||[])].sort(byRank))
const opponentCount=computed(()=>state.value?.players?.[opponentRole.value]?.count ?? 0)
const myScore=computed(()=>state.value?.scores?.[role] ?? 0)
const opponentScore=computed(()=>state.value?.scores?.[opponentRole.value] ?? 0)

const phaseText=computed(()=>{
  const map={
    waiting:'等待玩家',call:'叫地主',rob:'抢地主',double:'加倍',
    playing:'出牌阶段',finished:'本局结束',match_finished:'整场结束'
  }
  return map[state.value?.phase] || '连接中'
})

const centerHint=computed(()=>{
  if(!state.value) return '等待同步'
  if(state.value.phase==='call') return `${roleName(state.value.turn)} 正在决定是否叫地主`
  if(state.value.phase==='rob') return `抢地主 ${state.value.robRounds}/4 · 抢地主倍数 ×${state.value.robMultiplier}`
  if(state.value.phase==='double') return `${roleName(state.value.turn)} 正在决定是否加倍`
  if(state.value.phase==='playing') return state.value.turn===role?'请出牌':'等待对手出牌'
  if(state.value.phase==='finished') return `本局结算：×${state.value.multiplier}，${formatDelta()}`
  if(state.value.phase==='match_finished') return `八局制结算：${state.value.completedRounds}/${state.value.maxRounds} 局完成`
  return '等待另一名玩家加入'
})

const waitingText=computed(()=>{
  if(!state.value || state.value.phase==='waiting') return '等待另一名玩家加入'
  if(state.value.turn && state.value.turn!==role) return '等待对手操作'
  return ''
})

const roundResultText=computed(()=>{
  if(!state.value) return ''
  const result=state.value.winner===role?'你赢了':'对手获胜'
  return `${result} · 本局 ${formatSigned(state.value.roundDelta?.[role]||0)} 分`
})

const matchResultText=computed(()=>{
  if(!state.value) return ''
  if(!state.value.matchWinner) return `整场结束 · 平分 ${myScore.value}`
  return state.value.matchWinner===role
    ? `整场结束 · 你获胜 ${myScore.value} : ${opponentScore.value}`
    : `整场结束 · 对手获胜 ${myScore.value} : ${opponentScore.value}`
})

function roleName(value){
  if(!value) return '-'
  return value===role ? '你' : '对手'
}

function rankLabel(rank){
  if(rank==='SJ') return '小王'
  if(rank==='BJ') return '大王'
  return rank
}

function formatSigned(value){
  return value>0?`+${value}`:String(value)
}

function formatDelta(){
  const mine=state.value?.roundDelta?.[role]||0
  const theirs=state.value?.roundDelta?.[opponentRole.value]||0
  return `我 ${formatSigned(mine)} / 对手 ${formatSigned(theirs)}`
}

function toggle(id){
  selectedIds.value=selectedIds.value.includes(id)
    ? selectedIds.value.filter(x=>x!==id)
    : [...selectedIds.value,id]
}

function longestConsecutiveGroups(cards){
  const groups=[]
  for(const card of cards){
    const value=rankOrder[card.rank]||card.value
    let group=groups.find(g=>g.value===value)
    if(!group){
      group={value,cards:[]}
      groups.push(group)
    }
    group.cards.push(card)
  }
  groups.sort((a,b)=>b.value-a.value)

  let best=[]
  let current=[]
  for(const group of groups){
    if(group.value>14){
      if(current.length>best.length) best=current
      current=[]
      continue
    }
    if(current.length===0 || current.at(-1).value-group.value===1){
      current.push(group)
    }else{
      if(current.length>best.length) best=current
      current=[group]
    }
  }
  if(current.length>best.length) best=current
  return best
}

function autoPickDrag(cards){
  const run=longestConsecutiveGroups(cards)

  // 优先把有重复点数的长范围识别为顺子：每个点数只提起一张。
  if(run.length>=5){
    return run.map(group=>group.cards[0].id)
  }

  if(run.length>=3 && run.every(group=>group.cards.length>=2)){
    return run.flatMap(group=>group.cards.slice(0,2).map(card=>card.id))
  }

  if(run.length>=2 && run.every(group=>group.cards.length>=3)){
    return run.flatMap(group=>group.cards.slice(0,3).map(card=>card.id))
  }

  return cards.map(card=>card.id)
}

function updateDragSelection(){
  if(dragStart.value<0 || dragEnd.value<0) return
  const lo=Math.min(dragStart.value,dragEnd.value)
  const hi=Math.max(dragStart.value,dragEnd.value)
  selectedIds.value=autoPickDrag(sortedHand.value.slice(lo,hi+1))
}

function startDrag(index,event){
  if(state.value?.phase!=='playing' || state.value.turn!==role) return
  dragActive.value=true
  dragStart.value=index
  dragEnd.value=index
  dragMoved.value=false
  event.currentTarget?.setPointerCapture?.(event.pointerId)
}

function pointerMove(event){
  if(!dragActive.value) return
  const el=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-card-index]')
  if(!el) return
  const index=Number(el.dataset.cardIndex)
  if(!Number.isInteger(index) || index<0 || index>=sortedHand.value.length) return
  if(index!==dragEnd.value){
    dragEnd.value=index
    dragMoved.value=true
    updateDragSelection()
  }
}

function pointerUp(){
  if(!dragActive.value) return
  if(!dragMoved.value && dragStart.value>=0){
    toggle(sortedHand.value[dragStart.value].id)
  }else{
    updateDragSelection()
  }
  dragActive.value=false
  dragStart.value=-1
  dragEnd.value=-1
}

function call(value){ callLandlord(value) }
function rob(value){ robLandlord(value) }
function doubleChoice(value){ chooseDouble(value) }
function pass(){ passTurn() }

function playSelected(){
  const cards=sortedHand.value.filter(card=>selectedIds.value.includes(card.id))
  if(cards.length) playCards(cards)
}

function doReplace(){
  if(!adminTargetId.value) return
  replaceCard(adminTargetId.value,replaceRank.value,replaceSuit.value)
}

function saveScores(){
  setScores(Number(scoreAdminInput.value),Number(scorePlayerInput.value))
}

function forceRoundWin(winner){
  if(window.confirm('确认由管理员单方面结算本局？')) forceRound(winner)
}

function startNextRound(){ nextRound() }

function settleAndEnd(winner){
  if(window.confirm('确认结算当前局并立即结束整场？')){
    endMatch({winner,settleCurrent:true})
  }
}

function finishMatchOnly(){
  if(window.confirm('确认按当前记分板直接结束整场？')){
    endMatch({settleCurrent:false})
  }
}

function restartMatch(){
  if(window.confirm('确认清空比分并新开一场八局制游戏？')) resetMatch()
}

function resize(){ portrait.value=window.innerHeight>window.innerWidth }

function receiveState(next){
  state.value=next
  const available=new Set((next.hand||[]).map(card=>card.id))
  selectedIds.value=selectedIds.value.filter(id=>available.has(id))

  const opponentAvailable=new Set((next.opponentHand||[]).map(card=>card.id))
  if(adminTargetId.value && !opponentAvailable.has(adminTargetId.value)) adminTargetId.value=null

  scoreAdminInput.value=next.scores?.admin ?? 0
  scorePlayerInput.value=next.scores?.player ?? 0

  isError.value=false
  if(next.phase==='match_finished'){
    message.value='整场已经结算'
  }else if(next.phase==='finished'){
    message.value=`本局已结算：${formatDelta()}`
  }else if(next.turn===role){
    message.value='轮到你操作'
  }else{
    message.value='游戏状态已同步'
  }
}

function showError(text){
  isError.value=true
  message.value=text || '操作失败'
}

function handlePlayResult(result){
  if(result?.ok){
    selectedIds.value=[]
    isError.value=false
    message.value=result.play?.type==='bomb'||result.play?.type==='rocket'
      ? '炸弹生效，当前倍数已翻倍'
      : '出牌成功'
  }else if(result?.error){
    showError(result.error)
  }
}

function handleAdminResult(result){
  if(result?.ok){
    isError.value=false
    message.value='管理员操作已生效'
  }else if(result?.error){
    showError(result.error)
  }
}

function handleAdminReplace(result){
  if(result?.ok){
    adminTargetId.value=null
    handleAdminResult(result)
  }else handleAdminResult(result)
}

function handleNotice(text){
  isError.value=false
  message.value=text
}

function handleConnect(){ join(role,key) }

onMounted(()=>{
  window.addEventListener('resize',resize)
  window.addEventListener('pointermove',pointerMove,{passive:false})
  window.addEventListener('pointerup',pointerUp)
  window.addEventListener('pointercancel',pointerUp)
  socket.on('state',receiveState)
  socket.on('joinError',showError)
  socket.on('actionError',showError)
  socket.on('playResult',handlePlayResult)
  socket.on('adminReplaceResult',handleAdminReplace)
  socket.on('adminActionResult',handleAdminResult)
  socket.on('notice',handleNotice)
  socket.on('connect',handleConnect)
  if(socket.connected) handleConnect()
})

onBeforeUnmount(()=>{
  window.removeEventListener('resize',resize)
  window.removeEventListener('pointermove',pointerMove)
  window.removeEventListener('pointerup',pointerUp)
  window.removeEventListener('pointercancel',pointerUp)
  socket.off('state',receiveState)
  socket.off('joinError',showError)
  socket.off('actionError',showError)
  socket.off('playResult',handlePlayResult)
  socket.off('adminReplaceResult',handleAdminReplace)
  socket.off('adminActionResult',handleAdminResult)
  socket.off('notice',handleNotice)
  socket.off('connect',handleConnect)
})
</script>
