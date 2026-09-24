<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useFlowUiStore } from "../../../stores/flowUi.js";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog.vue";
import AddCommentDetails from "./node-details/AddCommentDetails.vue";
import BusinessHoursDetails from "./node-details/BusinessHoursDetails.vue";
import SendMessageDetails from "./node-details/SendMessageDetails.vue";
import TriggerDetails from "./node-details/TriggerDetails.vue";

const props = defineProps({ node: { type: Object, required: true } });
const emit = defineEmits(["close", "delete", "save"]);
const flowUi = useFlowUiStore();
const { detailsForm } = storeToRefs(flowUi);
const dialog = ref(null);
const formElement = ref(null);
const isDeleteDialogOpen = ref(false);

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

onMounted(() => {
  dialog.value?.showModal?.();
});

onBeforeUnmount(() => {
  flowUi.clearDetailsForm();
});

function saveNode() {
  if (!formElement.value?.checkValidity()) {
    return;
  }

  emit("save", detailsForm.value);
}

function confirmDelete() {
  isDeleteDialogOpen.value = false;
  emit("delete", detailsForm.value.id);
}
</script>

<template>
  <dialog
    ref="dialog"
    class="details-dialog"
    aria-labelledby="node-details-title"
    @cancel.prevent="emit('close')"
  >
    <header>
      <h2 id="node-details-title">NODE DETAILS</h2>
      <button type="button" aria-label="Close details" @click="emit('close')">
        ×
      </button>
    </header>

    <form ref="formElement" class="detail-form" novalidate @submit.prevent="saveNode">
      <div class="detail-body">
        <label class="detail-field">
          <span>Title</span>
          <input
            v-model="detailsForm.title"
            placeholder="Give name to this step"
            required
            pattern=".*\S.*"
          />
          <small
            class="field-error"
          >
            Enter a title to continue.
          </small>
        </label>
        <label class="detail-field">
          <span>Description</span>
          <textarea
            v-model="detailsForm.description"
            rows="3"
            placeholder="Describe this step"
          ></textarea>
        </label>
        <label class="detail-field">
          <span>Type</span><input :value="detailsForm.type" readonly />
        </label>
        <component :is="detailComponent" />
      </div>

      <footer>
        <button
          class="delete-button"
          type="button"
          @click="isDeleteDialogOpen = true"
        >
          Delete node
        </button>
        <button class="save-button" type="submit">Save changes</button>
      </footer>
    </form>
  </dialog>

  <DeleteConfirmationDialog
    :open="isDeleteDialogOpen"
    @cancel="isDeleteDialogOpen = false"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
.details-dialog {
  position: fixed;
  inset: 0 0 0 auto;
  display: flex;
  width: min(320px, 100vw);
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-left: 1px solid #dce3ec;
  flex-direction: column;
  background: #fff;
  box-shadow: -12px 0 32px rgb(15 23 42 / 12%);
}
.details-dialog::backdrop {
  background: rgb(15 23 42 / 18%);
}
header {
  display: flex;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid #edf1f5;
}
h2 {
  margin: 0.3rem 0 0;
  font-size: 1rem;
}
header button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  color: #64748b;
  background: #f1f5f9;
  font-size: 1.25rem;
  cursor: pointer;
}
.detail-form {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}
.detail-body {
  display: grid;
  min-height: 0;
  flex: 1;
  align-content: start;
  gap: 1rem;
  padding: 1.25rem;
  overflow-y: auto;
}
.detail-field {
  display: grid;
  gap: 0.42rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 750;
}
.detail-field:has(:required) > span::after {
  content: " *";
  color: #c24150;
}
input,
textarea {
  width: 100%;
  border: 1px solid #dce3ec;
  border-radius: 7px;
  padding: 0.65rem 0.7rem;
  color: #334155;
  background: #f8fafc;
  resize: none;
}
.detail-field:has(input:user-invalid) input {
  border-color: #e11d48;
  background: #fff1f2;
}
.field-error {
  display: none;
  color: #be123c;
  font-weight: 650;
}
.detail-field:has(input:user-invalid) .field-error {
  display: block;
}
footer {
  display: flex;
  gap: 0.6rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #edf1f5;
}
footer button {
  flex: 1;
  border-radius: 7px;
  padding: 0.65rem;
  font-weight: 750;
  cursor: pointer;
}
.delete-button {
  border: 1px solid #f0c1c6;
  color: #c24150;
  background: #fff;
}
.save-button {
  border: 1px solid #4057d6;
  color: #fff;
  background: #4057d6;
}
@media (max-width: 800px) {
  .details-dialog {
    width: min(320px, 88vw);
  }
}
</style>
