<script setup>
import {
  computed,
  markRaw,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import { useWorkflowQuery } from "../api/flowQueries.js";
import { findNodePosition } from "../utils/findNodePosition.js";
import { layoutWorkflow } from "../utils/layoutWorkflow.js";
import CreateNodeDialog from "./CreateNodeDialog.vue";
import NodeDetailsPanel from "./NodeDetailsPanel.vue";
import BranchNode from "./nodes/BranchNode.vue";
import WorkflowNode from "./nodes/WorkflowNode.vue";
import { useFlowUiStore } from "../../../stores/flowUi.js";

const {
  createWorkflowNodeMutation: createNode,
  data: workflow,
  deleteWorkflowNodeMutation: deleteNode,
  error,
  isError,
  isMutationError: isSyncError,
  isMutationPending: isSyncing,
  isPending,
  isScheduled: isWorkflowSaveScheduled,
  refetch,
  retryWorkflowSave,
  updateWorkflowNodeMutation: updateNode,
} = useWorkflowQuery();
const flowUi = useFlowUiStore();
const { selectedNodeId: selectedId, isCreateDialogOpen } = storeToRefs(flowUi);
const route = useRoute();
const router = useRouter();

const workspaceElement = ref(null);
const flowInstance = ref(null);
const layoutDirection = ref("LR");
const nodeTypes = {
  branch: markRaw(BranchNode),
  workflow: markRaw(WorkflowNode),
};

const calculatedLayout = computed(() =>
  layoutWorkflow(workflow.value ?? [], {
    direction: layoutDirection.value,
  }),
);

const nodes = computed(() =>
  [...(workflow.value ?? [])]
    .map((node) => {
      const id = String(node.id);
      const savedPosition = flowUi.positionsByNodeId[id];
      const children = (workflow.value ?? []).filter(
        (candidate) => String(candidate.parentId) === id,
      );

      return {
        id,
        type: node.type === "dateTimeConnector" ? "branch" : "workflow",
        position:
          savedPosition?.layoutDirection === layoutDirection.value
            ? savedPosition.position
            : calculatedLayout.value[id],
        tabPosition: calculatedLayout.value[id] ?? { x: 0, y: 0 },
        draggable: true,
        // Branch wrappers remain focusable; workflow buttons own focus.
        focusable: node.type === "dateTimeConnector",
        selectable: true,
        data: {
          ...node,
          id,
          hasChildren: children.length > 0,
          layoutDirection: layoutDirection.value,
        },
      };
    })
    .sort((a, b) => {
      const primary = layoutDirection.value === "TB" ? "y" : "x";
      const secondary = primary === "x" ? "y" : "x";
      return (
        a.tabPosition[primary] - b.tabPosition[primary] ||
        a.tabPosition[secondary] - b.tabPosition[secondary]
      );
    })
    .map(({ tabPosition, ...node }) => node),
);

const edges = computed(() =>
  (workflow.value ?? [])
    .filter((node) => node.parentId !== -1)
    .map((node) => ({
      id: `${node.parentId}-${node.id}`,
      source: String(node.parentId),
      target: String(node.id),
      type: "smoothstep",
    })),
);

const selectedNode = computed(() =>
  nodes.value.find((node) => node.id === selectedId.value),
);

watch(
  [() => route.params.nodeId, () => workflow.value],
  ([nodeId, availableWorkflow]) => {
    if (!nodeId) {
      selectedId.value = null;
      return;
    }

    if (!availableWorkflow) {
      return;
    }

    const node = nodes.value.find(
      (candidate) => candidate.id === String(nodeId),
    );

    if (!node || node.data.type === "dateTimeConnector") {
      router.replace({ name: "flow" });
      return;
    }

    selectedId.value = node.id;
  },
  { immediate: true },
);

function selectNode(node) {
  if (node.data?.type === "dateTimeConnector") {
    return;
  }

  router.push({ name: "flow-node", params: { nodeId: node.id } });
}

function closeDetails() {
  router.push({ name: "flow" });
}

function handleCreate(input) {
  const position = getNewNodePosition();
  const updatedWorkflow = createNode({
    ...input,
    position,
    layoutDirection: layoutDirection.value,
  });

  flowUi.setNodePosition(
    updatedWorkflow.at(-1).id,
    position,
    layoutDirection.value,
  );
  isCreateDialogOpen.value = false;
}

function getNewNodePosition() {
  const bounds = workspaceElement.value?.getBoundingClientRect();
  const viewport = flowInstance.value?.getViewport?.();

  return findNodePosition({
    bounds: bounds ?? {},
    nodes: nodes.value,
    edges: edges.value,
    reservedRight: selectedNode.value ? 340 : 0,
    project: flowInstance.value?.project ?? ((position) => position),
    toScreen: (position) => ({
      x:
        position.x * (viewport?.zoom ?? 1) + (viewport?.x ?? bounds?.left ?? 0),
      y: position.y * (viewport?.zoom ?? 1) + (viewport?.y ?? bounds?.top ?? 0),
    }),
  });
}

function handleNodeDragStop({ node }) {
  flowUi.setNodePosition(node.id, node.position, layoutDirection.value);
}

function handleNodeSave(payload) {
  updateNode(payload);
  closeDetails();
}

function handleNodeDelete(id) {
  const updatedWorkflow = deleteNode(id);

  flowUi.keepNodePositions(updatedWorkflow.map((node) => node.id));
  closeDetails();
}

function updateLayoutDirection({ width, height }) {
  layoutDirection.value = width >= height ? "LR" : "TB";
}

let resizeObserver;

onMounted(() => {
  if (!workspaceElement.value || typeof ResizeObserver === "undefined") {
    return;
  }

  resizeObserver = new ResizeObserver(([entry]) => {
    updateLayoutDirection(entry.contentRect);
  });
  resizeObserver.observe(workspaceElement.value);
  updateLayoutDirection(workspaceElement.value.getBoundingClientRect());
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <section
    ref="workspaceElement"
    class="flow-workspace"
    aria-label="Workflow canvas"
  >
    <div class="workspace-toolbar">
      <div class="toolbar-left">
        <div class="toolbar-copy">
          <span
            class="status-dot"
            :class="{
              'status-error': isSyncError,
              'status-syncing': isSyncing,
              'status-unsaved': isWorkflowSaveScheduled,
            }"
            aria-hidden="true"
          ></span>
          <span v-if="isSyncing">Syncing workflow…</span>
          <template v-else-if="isSyncError">
            <span>Changes are not saved.</span>
            <button type="button" @click="retryWorkflowSave">
              Save changes
            </button>
          </template>
          <span v-else-if="isWorkflowSaveScheduled">Unsaved changes.</span>
          <span v-else>Changes are successfully saved.</span>
        </div>
      </div>
      <button
        class="create-button"
        type="button"
        @click="isCreateDialogOpen = true"
      >
        <span aria-hidden="true">+</span>
        Create node
      </button>
    </div>

    <div v-if="isPending" class="canvas-state">Loading workflow…</div>
    <div v-else-if="isError" class="canvas-state">
      <p>{{ error.message }}</p>
      <button type="button" @click="refetch">Try again</button>
    </div>
    <div v-else-if="nodes.length === 0" class="canvas-state">
      This workflow has no nodes.
    </div>

    <VueFlow
      ref="flowInstance"
      v-else
      class="workflow-canvas"
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :min-zoom="0.35"
      :max-zoom="1.5"
      fit-view-on-init
      @node-click="({ node }) => selectNode(node)"
      @node-drag-stop="handleNodeDragStop"
    >
      <Background :gap="20" :size="1" pattern-color="#dce5ef" />
      <Controls :show-interactive="false" />
    </VueFlow>

    <NodeDetailsPanel
      v-if="selectedNode"
      :node="selectedNode"
      @close="closeDetails"
      @delete="handleNodeDelete"
      @save="handleNodeSave"
    />

    <CreateNodeDialog
      :open="isCreateDialogOpen"
      @create="handleCreate"
      @close="isCreateDialogOpen = false"
    />
  </section>
</template>

<style scoped>
.flow-workspace {
  position: relative;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid #dce3ec;
  border-radius: 18px;
  background: #f7f9fc;
  box-shadow: 0 18px 50px rgb(15 23 42 / 8%);
}
.workspace-toolbar {
  position: absolute;
  z-index: 6;
  top: 18px;
  left: 18px;
  right: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}
.toolbar-copy,
.toolbar-left,
.create-button {
  pointer-events: auto;
}
.toolbar-copy {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #64748b;
  background: rgb(255 255 255 / 92%);
  font-size: 0.76rem;
  font-weight: 650;
  box-shadow: 0 3px 10px rgb(15 23 42 / 5%);
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #20b486;
}
.status-dot.status-syncing,
.status-dot.status-unsaved {
  background: #f59e0b;
}
.status-dot.status-error {
  background: #e11d48;
}
.toolbar-copy button {
  border: 0;
  padding: 0;
  color: #4057d6;
  background: transparent;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}
.create-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 0;
  border-radius: 9px;
  padding: 0.72rem 0.9rem;
  color: #fff;
  background: #4057d6;
  box-shadow: 0 8px 18px rgb(64 87 214 / 24%);
  cursor: pointer;
  font-weight: 700;
}
.create-button span {
  font-size: 1.15rem;
  line-height: 0.8;
}
.workflow-canvas {
  height: 100%;
}
:deep(.vue-flow__node-branch:focus-visible) {
  outline: 3px solid #f59e0b;
  outline-offset: 3px;
  border-radius: 999px;
}
.canvas-state {
  display: grid;
  height: 100%;
  place-items: center;
  align-content: center;
  gap: 0.75rem;
  color: #64748b;
  font-size: 0.9rem;
}
.canvas-state p {
  margin: 0;
}
.canvas-state button {
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 0.5rem 0.75rem;
  color: #334155;
  background: #fff;
  cursor: pointer;
}
:deep(.vue-flow__minimap) {
  margin: 18px;
  border: 1px solid #dce3ec;
  border-radius: 8px;
  background: #fff;
}
:deep(.vue-flow__controls) {
  margin: 18px;
  overflow: hidden;
  border: 1px solid #dce3ec;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgb(15 23 42 / 8%);
}
:deep(.vue-flow__controls-button) {
  border-bottom-color: #e2e8f0;
  color: #334155;
  background: #fff;
}
@media (max-width: 800px) {
  .flow-workspace,
  .workflow-canvas {
    min-height: 0;
    height: 100%;
  }
  .toolbar-copy {
    display: none;
  }
}
</style>
