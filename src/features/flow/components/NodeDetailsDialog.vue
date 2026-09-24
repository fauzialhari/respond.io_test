<script setup>
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog.vue";
import { useFlowUiStore } from "../../../stores/flowUi.js";

const emit = defineEmits(["close", "delete", "save"]);
const dialog = ref(null);
const isDeleteDialogOpen = ref(false);
const { detailsForm } = storeToRefs(useFlowUiStore());

onMounted(() => {
  dialog.value?.showModal?.();
});

function confirmDelete() {
  isDeleteDialogOpen.value = false;
  emit("delete");
}
</script>

<template>
  <dialog
    ref="dialog"
    class="details-dialog"
    aria-labelledby="node-details-title"
    @cancel.prevent="$emit('close')"
  >
    <header>
      <div>
        <h2 id="node-details-title">NODE DETAILS</h2>
      </div>
      <button type="button" aria-label="Close details" @click="$emit('close')">
        ×
      </button>
    </header>

    <div class="detail-body">
      <label
        >Title<input
          v-model="detailsForm.name"
          placeholder="Give name to this step"
      /></label>
      <label
        >Description<textarea
          v-model="detailsForm.description"
          rows="3"
          placeholder="Describe this step"
        ></textarea>
      </label>
      <label>Type<input :value="detailsForm.type" readonly /></label>
      <slot name="content" />
    </div>

    <footer>
      <button
        class="delete-button"
        type="button"
        @click="isDeleteDialogOpen = true"
      >
        Delete node
      </button>
      <button class="save-button" type="button" @click="$emit('save')">
        Save changes
      </button>
    </footer>
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
header p {
  margin: 0;
  color: #7c89a6;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
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
.detail-body {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  overflow-y: auto;
}
label {
  display: grid;
  gap: 0.42rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 750;
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
