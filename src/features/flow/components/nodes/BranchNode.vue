<script setup>
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";

const props = defineProps({ data: { type: Object, required: true } });

const label = computed(() =>
  props.data.connectorType === "success" ? "Success" : "Failure",
);
const targetPosition = computed(() =>
  props.data.layoutDirection === "TB" ? Position.Top : Position.Left,
);
const sourcePosition = computed(() =>
  props.data.layoutDirection === "TB" ? Position.Bottom : Position.Right,
);
</script>

<template>
  <article
    class="branch-node"
    :class="`branch-${data.connectorType}`"
    role="group"
    tabindex="-1"
    :aria-label="`${label} path`"
  >
    <Handle type="target" :position="targetPosition" />
    <span>{{ label }}</span>
    <Handle v-if="data.hasChildren" type="source" :position="sourcePosition" />
  </article>
</template>

<style scoped>
.branch-node {
  min-width: 82px;
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
  user-select: none;
}
.branch-node:focus-visible {
  outline: 3px solid #f59e0b;
  outline-offset: 3px;
}
.branch-success {
  color: #2563eb;
  background: #dbeafe;
}
.branch-failure {
  color: #b45309;
  background: #ffedd5;
}
:deep(.vue-flow__handle) {
  width: 7px;
  height: 7px;
  border: 2px solid #fff;
  background: currentColor;
  opacity: 0;
}
</style>
