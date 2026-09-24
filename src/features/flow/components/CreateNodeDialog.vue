<script setup>
import { nextTick, ref, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "create"]);

const dialogElement = ref(null);
const formElement = ref(null);
const selectedType = ref("sendMessage");
const name = ref("");
const description = ref("");

watch(
  () => props.open,
  async (isOpen) => {
    await nextTick();

    if (isOpen && !dialogElement.value?.open) {
      dialogElement.value?.showModal?.();
    }

    if (!isOpen && dialogElement.value?.open) {
      dialogElement.value.close();
    }
  },
  { immediate: true },
);

function closeDialog() {
  resetForm();

  if (dialogElement.value?.close) {
    dialogElement.value.close();
    return;
  }

  emit("close");
}

function handleNativeClose() {
  resetForm();
  emit("close");
}

function resetForm() {
  selectedType.value = "sendMessage";
  name.value = "";
  description.value = "";
}

function createData() {
  if (selectedType.value === "sendMessage") {
    return { payload: [] };
  }

  if (selectedType.value === "addComment") {
    return { comment: "" };
  }

  if (selectedType.value === "businessHours") {
    return {
      action: "businessHours",
      timezone: "UTC",
      times: [{ day: "mon", startTime: "09:00", endTime: "17:00" }],
    };
  }

  return { comment: "" };
}

function submit() {
  if (!formElement.value?.checkValidity()) {
    return;
  }

  const node = {
    name: name.value.trim(),
    description: description.value.trim(),
    type: selectedType.value,
    data: createData(),
  };

  resetForm();
  emit("create", node);
}

</script>

<template>
  <dialog
    ref="dialogElement"
    class="create-node-dialog"
    aria-labelledby="create-node-title"
    @cancel.prevent="closeDialog"
    @close="handleNativeClose"
  >
    <form ref="formElement" novalidate @submit.prevent="submit">
      <header>
        <div>
          <p>WORKFLOW</p>
          <h2 id="create-node-title">Create a node</h2>
        </div>
        <button
          type="button"
          class="close-button"
          aria-label="Close dialog"
          @click="closeDialog"
        >
          ×
        </button>
      </header>

      <div class="dialog-content">
        <label class="form-group">
          <span>Node type</span>
          <select v-model="selectedType">
            <option value="sendMessage">Send Message</option>
            <option value="addComment">Add Comments</option>
            <option value="businessHours">Business Hours</option>
          </select>
        </label>

        <label class="form-group">
          <span>Title</span>
          <input
            v-model="name"
            placeholder="e.g. Follow-up message"
            autocomplete="off"
            required
            pattern=".*\S.*"
          />
          <small
            class="field-error"
          >
            Enter a title to continue.
          </small>
        </label>

        <label class="form-group">
          <span>Description</span>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Describe this node"
          ></textarea>
        </label>

      </div>

      <footer>
        <button class="secondary" type="button" @click="closeDialog">
          Cancel
        </button>
        <button class="primary" type="submit">Create node</button>
      </footer>
    </form>
  </dialog>
</template>

<style scoped>
.create-node-dialog {
  width: min(440px, calc(100vw - 2rem));
  margin: auto;
  border: 0;
  border-radius: 14px;
  padding: 0;
  color: #1e293b;
  box-shadow: 0 24px 50px rgb(15 23 42 / 24%);
}
.create-node-dialog::backdrop {
  background: rgb(15 23 42 / 38%);
}
header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid #edf1f5;
}
header p {
  margin: 0;
  color: #7c89a6;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}
h2 {
  margin: 0.25rem 0 0;
  font-size: 1.1rem;
}
.close-button {
  border: 0;
  color: #64748b;
  background: transparent;
  font-size: 1.35rem;
  cursor: pointer;
}
.dialog-content {
  display: grid;
  gap: 0.95rem;
  padding: 1.25rem;
}
.form-group {
  display: grid;
  gap: 0.4rem;
  color: #475569;
  font-size: 0.74rem;
  font-weight: 750;
}
.form-group:has(:required) > span::after {
  content: " *";
  color: #c24150;
}
input,
textarea,
select {
  width: 100%;
  border: 1px solid #dce3ec;
  border-radius: 7px;
  padding: 0.65rem 0.7rem;
  color: #334155;
  background: #fff;
  font: inherit;
  resize: vertical;
}
.form-group:has(input:user-invalid) input {
  border-color: #e11d48;
  background: #fff1f2;
}
.field-error {
  display: none;
  color: #be123c;
  font-weight: 650;
}
.form-group:has(input:user-invalid) .field-error {
  display: block;
}
footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #edf1f5;
}
footer button {
  border-radius: 7px;
  padding: 0.62rem 0.85rem;
  font-weight: 750;
  cursor: pointer;
}
.secondary {
  border: 1px solid #dce3ec;
  color: #475569;
  background: #fff;
}
.primary {
  border: 1px solid #4057d6;
  color: #fff;
  background: #4057d6;
}
</style>
