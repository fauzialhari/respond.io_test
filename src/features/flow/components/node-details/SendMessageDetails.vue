<script setup>
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { uploadAttachment } from "../../api/attachmentService.js";
import { useFlowUiStore } from "../../../../stores/flowUi.js";

const { detailsForm } = storeToRefs(useFlowUiStore());
const attachmentInput = ref(null);
const isUploading = ref(false);
const uploadError = ref("");

async function addAttachment(event) {
  const [file] = event.target.files ?? [];

  if (!file) {
    return;
  }

  isUploading.value = true;
  uploadError.value = "";

  try {
    detailsForm.value.attachments.push(await uploadAttachment(file));
  } catch (error) {
    uploadError.value = error.message;
  } finally {
    isUploading.value = false;
    event.target.value = "";
  }
}

function removeAttachment(index) {
  detailsForm.value.attachments.splice(index, 1);
}
</script>

<template>
  <label>Message<textarea v-model="detailsForm.message" rows="5"></textarea></label>
  <section class="attachments" aria-label="Attachments">
    <div class="attachment-heading">
      <span>Attachments</span>
      <button
        type="button"
        :disabled="isUploading"
        @click="attachmentInput?.click()"
      >
        {{ isUploading ? "Uploading…" : "Upload attachment" }}
      </button>
    </div>
    <input
      ref="attachmentInput"
      class="attachment-input"
      type="file"
      @change="addAttachment"
    />
    <div v-if="detailsForm.attachments.length" class="attachment-grid">
      <figure
        v-for="(attachment, index) in detailsForm.attachments"
        :key="attachment"
        class="attachment-tile"
      >
        <img :src="attachment" :alt="`Attachment ${index + 1} preview`" />
        <button
          type="button"
          class="attachment-delete"
          :aria-label="`Remove attachment ${index + 1}`"
          @click="removeAttachment(index)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </figure>
    </div>
    <p v-else class="empty-attachments">No attachments uploaded.</p>
    <p v-if="uploadError" class="upload-error" role="alert">{{ uploadError }}</p>
  </section>
</template>

<style scoped>
label {
  display: grid;
  gap: 0.42rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 750;
}
textarea {
  width: 100%;
  border: 1px solid #dce3ec;
  border-radius: 7px;
  padding: 0.65rem 0.7rem;
  color: #334155;
  background: #f8fafc;
  resize: none;
}
.attachments {
  display: grid;
  gap: 0.65rem;
}
.attachment-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 750;
}
.attachment-heading button {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.55rem;
  color: #4057d6;
  background: #fff;
  font: inherit;
  cursor: pointer;
}
.attachment-heading button:disabled {
  cursor: wait;
  opacity: 0.6;
}
.attachment-input {
  display: none;
}
.attachment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
}
.attachment-tile {
  position: relative;
  aspect-ratio: 1;
  margin: 0;
  overflow: hidden;
  border: 1px solid #dce3ec;
  border-radius: 7px;
  background: #f8fafc;
}
.attachment-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.attachment-delete {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 85%);
  border-radius: 999px;
  color: #fff;
  background: rgb(15 23 42 / 78%);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}
.attachment-delete:hover {
  background: #be123c;
}
.attachment-delete:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}
.empty-attachments,
.upload-error {
  margin: 0;
  color: #64748b;
  font-size: 0.73rem;
}
.upload-error {
  color: #be123c;
}
</style>
