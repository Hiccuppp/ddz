<template>
  <div class="game">
    <div v-if="portrait" class="rotate">请横屏游玩</div>

    <template v-else>
      <header class="topbar">
        <span>{{ role === 'admin' ? '管理员玩家' : '普通玩家' }}</span>
        <span>{{ phaseText }}</span>
        <span v-if="state?.landlord">地主：{{ roleName(state.landlord) }}</span>
      </header>

      <section class="opponent">
        <div class="player-title">
          对手 · {{ opponentCount }} 张
          <span v-if="state?.turn === opponentRole" class="turn-tag">行动中</span>
        </div>
        <div class="backs">
          <span v-for="n in Math.min(opponentCount, 12)" :key="n" class="back">🂠</span>
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

          <div class="info-box">
            <span>底牌</span>
            <div class="bottom-cards">
              <Card v-for="card in state?.bottom || []" :key="card.id" :card="card" compact />
              <b v-if="!state?.bottom?.length">?</b>
            </div>
          </div>
        </div>

        <div class="message" :class="{error:isError}">{{ message }}</div>
      </section>

      <section v-if="role==='admin' && state?.opponentHand?.length" class="admin-peek">
        <span>管理员视图：</span>
        <Card v-for="card in sortedOpponentHand" :key="card.id" :card="card" compact />
      </section>

      <section class="my-area">
        <div class="player-title">
          我 · {{ sortedHand.length }} 张
          <span v-if="state?.turn === role" class="turn-tag">轮到你</span>
        </div>
        <div class="hand-row">
          <Card
            v-for="card in sortedHand"
            :key="card.id"
            :card="card"
            :selected="selectedIds.includes(card.id)"
            @click="toggle(card.id)"
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

        <template v-else-if="state?.phase==='playing' && state.turn===role">
          <button class="primary" :disabled="selectedIds.length===0" @click="playSelected">出牌</button>
          <button :disabled="!state.lastPlay" @click="pass">不要</button>
        </template>

        <div v-else-if="state?.phase==='finished'" class="winner">
          {{ state.winner===role ? '你赢了' : '对手获胜' }}
        </div>

        <div v-else class="waiting-action">{{ waitingText }}</div>
      </footer>
    </template>
  </div>
</template>

<script setup>
import {computed,onBeforeUnmount,onMounted,ref} from 'vue'
import Card from './components/Card.vue'
import {socket,join,callLandlord,robLandlord,playCards,passTurn} from './socket.js'

const state=ref(null)
const selectedIds=ref([])
const message=ref('正在连接服务器…')
const isError=ref(false)
const portrait=ref(window.innerHeight>window.innerWidth)

const isAdmin=window.location.pathname.startsWith('/admin')
const role=isAdmin?'admin':'player'
const key=new URLSearchParams(window.location.search).get('key') || ''
const opponentRole=computed(()=>role==='admin'?'player':'admin')

const rankOrder={3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,J:11,Q:12,K:13,A:14,2:15,SJ:16,BJ:17}
const byRank=(a,b)=>(rankOrder[a.rank]||a.value)-(rankOrder[b.rank]||b.value) || (a.suit||'').localeCompare(b.suit||'')

const sortedHand=computed(()=>[...(state.value?.hand||[])].sort(byRank))
const sortedOpponentHand=computed(()=>[...(state.value?.opponentHand||[])].sort(byRank))
const opponentCount=computed(()=>state.value?.players?.[opponentRole.value]?.count ?? 0)

const phaseText=computed(()=>{
  const map={waiting:'等待玩家',call:'叫地主',rob:'抢地主',playing:'出牌阶段',finished:'游戏结束'}
  return map[state.value?.phase] || '连接中'
})

const centerHint=computed(()=>{
  if(!state.value) return '等待同步'
  if(state.value.phase==='call') return `${roleName(state.value.turn)} 正在决定是否叫地主`
  if(state.value.phase==='rob') return `抢地主 ${state.value.robRounds}/4 · 已成功抢 ${state.value.robCount} 次`
  if(state.value.phase==='playing') return state.value.turn===role?'请出牌':'等待对手出牌'
  if(state.value.phase==='finished') return '本局结束'
  return '等待另一名玩家加入'
})

const waitingText=computed(()=>{
  if(!state.value || state.value.phase==='waiting') return '等待另一名玩家加入'
  if(state.value.turn && state.value.turn!==role) return '等待对手操作'
  return ''
})

function roleName(value){
  if(!value) return '-'
  if(value===role) return '你'
  return '对手'
}

function toggle(id){
  if(state.value?.phase!=='playing' || state.value.turn!==role) return
  selectedIds.value=selectedIds.value.includes(id)
    ? selectedIds.value.filter(x=>x!==id)
    : [...selectedIds.value,id]
}

function call(value){ callLandlord(value) }
function rob(value){ robLandlord(value) }
function pass(){ passTurn() }

function playSelected(){
  const cards=sortedHand.value.filter(card=>selectedIds.value.includes(card.id))
  if(cards.length) playCards(cards)
}

function resize(){
  portrait.value=window.innerHeight>window.innerWidth
}

function receiveState(next){
  state.value=next
  const available=new Set((next.hand||[]).map(card=>card.id))
  selectedIds.value=selectedIds.value.filter(id=>available.has(id))
  isError.value=false

  if(next.phase==='finished'){
    message.value=next.winner===role?'本局胜利':'本局失败'
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
    message.value='出牌成功'
  }else if(result?.error){
    showError(result.error)
  }
}

onMounted(()=>{
  window.addEventListener('resize',resize)
  socket.on('state',receiveState)
  socket.on('joinError',showError)
  socket.on('actionError',showError)
  socket.on('playResult',handlePlayResult)
  socket.on('connect',()=>join(role,key))
  if(socket.connected) join(role,key)
})

onBeforeUnmount(()=>{
  window.removeEventListener('resize',resize)
  socket.off('state',receiveState)
  socket.off('joinError',showError)
  socket.off('actionError',showError)
  socket.off('playResult',handlePlayResult)
})
</script>
