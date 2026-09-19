<template>
<div class="table">
 <div class="opponent">对手 🂠 {{opponent}}</div>
 <div class="center">{{phaseText}}</div>
 <div class="hand">我的手牌 {{myCount}} 张</div>
 <div class="buttons">
  <button @click="$emit('call',true)">叫地主</button>
  <button @click="$emit('call',false)">不叫</button>
 </div>
</div>
</template>
<script setup>
defineProps({opponent:Number,myCount:Number,phaseText:String})
defineEmits(['call'])
</script>
