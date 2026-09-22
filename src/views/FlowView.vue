<script setup>
import FlowCanvas from '../features/flow/components/FlowCanvas.vue'
</script>

<template>
  <main class="flow-view">
    <header>
      <p class="eyebrow">Flow chart application</p>
      <h1>Workflow canvas</h1>
    </header>
    <FlowCanvas />
  </main>
</template>

<style scoped>
.flow-view { min-height: 100vh; padding: 2rem; }
.eyebrow { margin: 0; color: #64748b; font-size: .875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; }
h1 { margin: .25rem 0 1.5rem; font-size: 2rem; }
</style>
