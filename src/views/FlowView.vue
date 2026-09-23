<script setup>
import FlowCanvas from "../features/flow/components/FlowCanvas.vue";
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
.flow-view {
  height: 100dvh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  overflow: hidden;
}
.eyebrow {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
h1 {
  margin: 0.25rem 0 1.5rem;
  font-size: 2rem;
}
:deep(.flow-workspace) {
  flex: 1;
  min-height: 0;
}
</style>
