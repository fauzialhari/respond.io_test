import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { queryClient } from './api/queryClient'
import { router } from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')
