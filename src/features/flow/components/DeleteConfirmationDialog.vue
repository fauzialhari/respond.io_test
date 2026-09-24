<script setup>
import { nextTick, ref, watch } from "vue";

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(["cancel", "confirm"]);
const dialog = ref(null);

watch(
  () => props.open,
  async (isOpen) => {
    await nextTick();

    if (isOpen && !dialog.value?.open) {
      dialog.value?.showModal?.();
    }

    if (!isOpen && dialog.value?.open) {
      dialog.value.close?.();
    }
  },
  { immediate: true },
);
</script>

<template>
  <dialog
    ref="dialog"
    class="delete-confirmation"
    aria-labelledby="delete-node-title"
    @cancel.prevent="$emit('cancel')"
    @close="$emit('cancel')"
  >
    <h2 id="delete-node-title">Delete this node?</h2>
    <p>
      Are you sure you want to delete this node? This will also delete any
      child nodes.
    </p>
    <div class="confirmation-actions">
      <button type="button" @click="$emit('cancel')">Cancel</button>
      <button class="confirm-delete-button" type="button" @click="$emit('confirm')">
        Delete node
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.delete-confirmation {
  width: min(360px, calc(100vw - 2rem));
  margin: auto;
  border: 0;
  border-radius: 12px;
  padding: 1.25rem;
  color: #1e293b;
  box-shadow: 0 24px 50px rgb(15 23 42 / 24%);
}
.delete-confirmation::backdrop {
  background: rgb(15 23 42 / 38%);
}
h2 {
  margin: 0;
  font-size: 1rem;
}
p {
  margin: 0.65rem 0 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.5;
}
.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
}
.confirmation-actions button {
  border: 1px solid #dce3ec;
  border-radius: 7px;
  padding: 0.62rem 0.85rem;
  color: #475569;
  background: #fff;
  font-weight: 750;
  cursor: pointer;
}
.confirmation-actions .confirm-delete-button {
  border-color: #c24150;
  color: #fff;
  background: #c24150;
}
</style>
