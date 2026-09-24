<script setup>
import { computed, onBeforeUnmount, watch } from "vue";
import { useFlowUiStore } from "../../../stores/flowUi.js";
import NodeDetailsDialog from "./NodeDetailsDialog.vue";
import AddCommentDetails from "./node-details/AddCommentDetails.vue";
import BusinessHoursDetails from "./node-details/BusinessHoursDetails.vue";
import SendMessageDetails from "./node-details/SendMessageDetails.vue";
import TriggerDetails from "./node-details/TriggerDetails.vue";

const props = defineProps({ node: { type: Object, required: true } });
const emit = defineEmits(["close", "delete", "save"]);
const flowUi = useFlowUiStore();

const detailComponent = computed(() => {
  const components = {
    sendMessage: SendMessageDetails,
    addComment: AddCommentDetails,
    dateTime: BusinessHoursDetails,
    businessHours: BusinessHoursDetails,
  };

  return components[props.node.data.type] ?? TriggerDetails;
});

watch(
  () => props.node,
  (node) => flowUi.setDetailsForm(node.data),
  { immediate: true },
);

function saveNode() {
  emit("save", flowUi.getDetailsFormChanges());
}

function deleteNode() {
  emit("delete", flowUi.detailsForm.nodeId);
}

onBeforeUnmount(() => {
  flowUi.clearDetailsForm();
});
</script>

<template>
  <NodeDetailsDialog @close="emit('close')" @delete="deleteNode" @save="saveNode">
    <template #content>
      <component :is="detailComponent" />
    </template>
  </NodeDetailsDialog>
</template>
