import { createRouter, createWebHistory } from 'vue-router'
import FlowView from '../views/FlowView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'flow', component: FlowView },
    { path: '/node/:nodeId', name: 'flow-node', component: FlowView },
  ],
})
