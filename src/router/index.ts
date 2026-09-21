import { createRouter, createWebHistory } from 'vue-router'
import FlowView from '../views/FlowView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/flow' },
    { path: '/flow', name: 'flow', component: FlowView },
    { path: '/flow/node/:nodeId', name: 'flow-node', component: FlowView },
  ],
})
