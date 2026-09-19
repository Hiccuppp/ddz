<template>
  <button
    type="button"
    class="card"
    :class="{selected,compact,red:isRed,joker:isJoker}"
    @click="$emit('click')"
  >
    <span class="rank">{{ label }}</span>
    <span v-if="card.suit" class="suit">{{ card.suit }}</span>
  </button>
</template>

<script setup>
import {computed} from 'vue'

const props=defineProps({
  card:{type:Object,required:true},
  selected:{type:Boolean,default:false},
  compact:{type:Boolean,default:false}
})

defineEmits(['click'])

const isRed=computed(()=>props.card.suit==='♥' || props.card.suit==='♦')
const isJoker=computed(()=>props.card.rank==='SJ' || props.card.rank==='BJ')
const label=computed(()=>{
  if(props.card.rank==='SJ') return '小王'
  if(props.card.rank==='BJ') return '大王'
  return props.card.rank
})
</script>
