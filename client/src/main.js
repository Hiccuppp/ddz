import {createApp,ref} from 'vue';
import {io} from 'socket.io-client';

const socket=io();
const state=ref(null);
socket.on('state',v=>state.value=v);

createApp({setup(){return{state}},template:`<div class="game"><h2 v-if="!state">等待玩家...</h2><template v-else><h2>双人斗地主</h2><div>阶段: {{state.phase}}</div></template></div>`}}).mount('#app');
