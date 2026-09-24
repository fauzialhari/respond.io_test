<script setup>
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";

const props = defineProps({ data: { type: Object, required: true } });

const typeMeta = computed(
  () =>
    ({
      trigger: { icon: "⚡", tone: "purple" },
      dateTime: { icon: "◷", tone: "blue" },
      businessHours: { icon: "◷", tone: "blue" },
      sendMessage: { icon: "✉", tone: "blue" },
      addComment: { icon: "▣", tone: "yellow" },
    })[props.data.type] ?? { icon: "○", tone: "blue" },
);

const displayName = computed(() => props.data.title ?? props.data.type);
const displayDescription = computed(() => {
  if (props.data.description?.trim()) {
    return props.data.description;
  }

  if (props.data.message) {
    return props.data.message;
  }

  if (props.data.comment) {
    return props.data.comment;
  }

  if (["dateTime", "businessHours"].includes(props.data.type)) {
    return `Business hours · ${props.data.timezone}`;
  }

  if (props.data.type === "trigger") {
    return "Starts when a conversation opens";
  }

  return "No description yet";
});
const targetPosition = computed(() =>
  props.data.layoutDirection === "TB" ? Position.Top : Position.Left,
);
const sourcePosition = computed(() =>
  props.data.layoutDirection === "TB" ? Position.Bottom : Position.Right,
);
</script>

<template>
  <article class="workflow-node" :class="`tone-${typeMeta.tone}`">
    <Handle
      v-if="data.parentId !== -1"
      type="target"
      :position="targetPosition"
    />
    <span class="node-icon" aria-hidden="true">{{ typeMeta.icon }}</span>
    <div class="node-copy">
      <strong>{{ displayName }}</strong>
      <p :title="displayDescription">{{ displayDescription }}</p>
    </div>

    <Handle v-if="data.hasChildren" type="source" :position="sourcePosition" />
  </article>
</template>

<style scoped>
.workflow-node {
  display: flex;
  width: 210px;
  align-items: flex-start;
  gap: 0.65rem;
  overflow: visible;
  border: 1px solid #dce3ec;
  border-radius: 11px;
  padding: 0.8rem;
  color: #1e293b;
  background: #fff;
  box-shadow: 0 7px 18px rgb(15 23 42 / 8%);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.workflow-node:hover {
  border-color: #7184df;
  box-shadow: 0 10px 24px rgb(42 54 136 / 15%);
}
.node-icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 7px;
  color: #4057d6;
  background: #eef1ff;
  font-size: 0.9rem;
}
.node-copy {
  min-width: 0;
}
.node-copy strong {
  display: block;
  overflow: hidden;
  font-size: 0.86rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node-copy p {
  display: -webkit-box;
  margin: 0.18rem 0 0;
  overflow: hidden;
  color: #64748b;
  font-size: 0.73rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  white-space: pre-line;
}
.tone-yellow .node-icon {
  color: #a16207;
  background: #fef9c3;
}
.tone-purple .node-icon {
  color: #7c3aed;
  background: #f3e8ff;
}
:deep(.vue-flow__handle) {
  width: 9px;
  height: 9px;
  border: 2px solid #fff;
  background: #6878da;
}
</style>
