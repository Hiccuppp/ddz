<template>
  <div class="game" @touchstart="touch">
    <div v-if="portrait" class="rotate">请横屏游玩</div>
    <template v-else>
      <section class="opponent">
        <h3>对手</h3>
        <div class="cards-back">🂠 × {{ opponentCount }}</div>
      </section>

      <section class="center">
        <div>阶段: {{ state?.phase || '连接中' }}</div>
        <div class="message">{{ message }}</div>
      </section>

      <section class="hand">
        <button v-for="card in hand" :key="card" @click="select(card)" :class="{up:selected.includes(card)}">
          {{card}}
        </button>
      </section>

      <footer>
        <button>叫地主</button>
        <button>出牌</button>
        <button>不要</button>
      </footer>
    </template>
  </div>
</template>

<script setup>
import {computed,ref} from 'vue'
const selected=ref([])
const state=ref(null)
const message=ref('等待游戏开始')
const hand=ref([])
const opponentCount=ref(21)
const portrait=computed(()=>window.innerHeight>window.innerWidth)
function select(c){
 selected.value.includes(c)
 ? selected.value=selected.value.filter(x=>x!==c)
 : selected.value.push(c)
}
function touch(){}
</script>
