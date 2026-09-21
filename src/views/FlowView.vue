<template>
  <main class="flow-view">
    <header>
      <p class="eyebrow">Flow chart application</p>
      <h1>Workflow canvas</h1>
    </header>
    <section class="canvas-placeholder" aria-label="Workflow canvas">
      <p>The flow canvas will appear here.</p>
    </section>
  </main>
</template>

<style scoped>
.flow-view { min-height: 100vh; padding: 2rem; }
.eyebrow { margin: 0; color: #64748b; font-size: .875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; }
h1 { margin: .25rem 0 1.5rem; font-size: 2rem; }
.canvas-placeholder { display: grid; min-height: 60vh; place-items: center; border: 1px dashed #94a3b8; border-radius: .75rem; color: #64748b; background: #fff; }
</style>
