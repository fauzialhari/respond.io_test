<script setup>
import { computed, ref, watch } from "vue";
import { uploadAttachment } from "../api/attachmentService.js";

const props = defineProps({ node: { type: Object, required: true } });
const emit = defineEmits(["close", "delete", "save"]);

const detail = computed(() => props.node.data);
const title = computed(() => detail.value.name ?? "Conversation opened");
const isMessageNode = computed(() => detail.value.type === "sendMessage");
const isCommentNode = computed(() => detail.value.type === "addComment");
const isBusinessHoursNode = computed(() =>
  ["dateTime", "businessHours"].includes(detail.value.type),
);
const form = ref({});
const attachmentInput = ref(null);
const isUploading = ref(false);
const uploadError = ref("");
const businessDays = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

function normalizeTimes(times = []) {
  return businessDays.map(({ key }) => {
    const existingTime = times.find((time) => time.day === key);

    return {
      day: key,
      startTime: existingTime?.startTime ?? "",
      endTime: existingTime?.endTime ?? "",
    };
  });
}

watch(
  () => props.node,
  (node) => {
    form.value = {
      name: node.data.name ?? "Conversation opened",
      description: node.data.description ?? "",
      message:
        node.data.data.payload?.find((part) => part.type === "text")?.text ??
        "",
      comment: node.data.data.comment ?? "",
      attachments:
        node.data.data.payload
          ?.filter((part) => part.type === "attachment")
          .map((part) => part.attachment) ?? [],
      timezone: node.data.data.timezone ?? "UTC",
      times: normalizeTimes(node.data.data.times),
    };
  },
  { immediate: true },
);

function saveNode() {
  const data = { ...detail.value.data };

  if (isMessageNode.value) {
    data.payload = [
      { type: "text", text: form.value.message },
      ...form.value.attachments.map((attachment) => ({
        type: "attachment",
        attachment,
      })),
    ];
  }

  if (data.comment !== undefined) {
    data.comment = form.value.comment;
  }

  if (data.times) {
    data.timezone = form.value.timezone;
    data.times = form.value.times.map(({ day, startTime, endTime }) => ({
      day,
      startTime,
      endTime,
    }));
  }

  emit("save", {
    id: detail.value.id,
    changes: {
      name: form.value.name,
      description: form.value.description,
      data,
    },
  });
}

async function addAttachment(event) {
  const [file] = event.target.files ?? [];

  if (!file) {
    return;
  }

  isUploading.value = true;
  uploadError.value = "";

  try {
    form.value.attachments.push(await uploadAttachment(file));
  } catch (error) {
    uploadError.value = error.message;
  } finally {
    isUploading.value = false;
    event.target.value = "";
  }
}
</script>

<template>
  <aside class="details-panel" aria-label="Node details">
    <header>
      <div>
        <p>NODE DETAILS</p>
        <h2>{{ title }}</h2>
      </div>
      <button type="button" aria-label="Close details" @click="$emit('close')">
        ×
      </button>
    </header>

    <div class="detail-body">
      <label>Title<input v-model="form.name" /></label>
      <label
        >Description<textarea
          v-model="form.description"
          rows="3"
          placeholder="Describe this step"
        ></textarea>
      </label>
      <label>Type<input :value="detail.type" readonly /></label>

      <template v-if="isMessageNode">
        <label
          >Message<textarea v-model="form.message" rows="5"></textarea>
        </label>
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
          <div v-if="form.attachments.length" class="attachment-grid">
            <figure
              v-for="(attachment, index) in form.attachments"
              :key="attachment"
              class="attachment-tile"
            >
              <img :src="attachment" :alt="`Attachment ${index + 1} preview`" />
            </figure>
          </div>
          <p v-else class="empty-attachments">No attachments uploaded.</p>
          <p v-if="uploadError" class="upload-error" role="alert">
            {{ uploadError }}
          </p>
        </section>
      </template>

      <template v-else-if="isCommentNode">
        <label
          >Comment<textarea v-model="form.comment" rows="4"></textarea>
        </label>
      </template>

      <template v-else-if="isBusinessHoursNode">
        <section class="business-hours" aria-label="Business hours">
          <div class="hours-heading">
            <span>Day</span><span>Business hours</span>
          </div>
          <div
            v-for="(time, index) in form.times"
            :key="time.day"
            class="time-row"
          >
            <strong>{{ businessDays[index].label }}</strong>
            <input
              v-model="time.startTime"
              type="time"
              :aria-label="`${businessDays[index].label} start time`"
            />
            <span>to</span>
            <input
              v-model="time.endTime"
              type="time"
              :aria-label="`${businessDays[index].label} end time`"
            />
          </div>
        </section>
        <label
          >Time zone
          <select v-model="form.timezone" aria-label="Time zone">
            <option value="UTC">(GMT+00:00) UTC</option>
          </select>
        </label>
      </template>

      <template v-else>
        <div class="empty-detail">
          This trigger starts the workflow when a conversation opens.
        </div>
      </template>
    </div>

    <footer>
      <button
        class="delete-button"
        type="button"
        @click="emit('delete', detail.id)"
      >
        Delete node
      </button>
      <button class="save-button" type="button" @click="saveNode">
        Save changes
      </button>
    </footer>
  </aside>
</template>

<style scoped>
.details-panel {
  position: absolute;
  z-index: 8;
  top: 0;
  right: 0;
  display: flex;
  width: 320px;
  height: 100%;
  flex-direction: column;
  border-left: 1px solid #dce3ec;
  background: #fff;
  box-shadow: -12px 0 32px rgb(15 23 42 / 12%);
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
textarea,
select {
  width: 100%;
  border: 1px solid #dce3ec;
  border-radius: 7px;
  padding: 0.65rem 0.7rem;
  color: #334155;
  background: #f8fafc;
  resize: none;
}
.empty-detail {
  border-radius: 7px;
  padding: 0.75rem;
  color: #52627c;
  background: #f2f5ff;
  font-size: 0.76rem;
  line-height: 1.45;
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
.empty-attachments,
.upload-error {
  margin: 0;
  color: #64748b;
  font-size: 0.73rem;
}
.upload-error {
  color: #be123c;
}
.business-hours {
  display: grid;
  gap: 0.55rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.8rem;
}
.hours-heading,
.time-row {
  display: grid;
  grid-template-columns: 30px 1fr 15px 1fr;
  align-items: center;
  gap: 0.4rem;
}
.hours-heading {
  grid-template-columns: 30px 1fr;
  color: #64748b;
  font-size: 0.65rem;
  font-weight: 800;
}
.time-row strong {
  font-size: 0.72rem;
}
.time-row input {
  min-width: 0;
  padding: 0.45rem;
  font-size: 0.72rem;
}
.time-row span {
  color: #64748b;
  font-size: 0.7rem;
  text-align: center;
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
  .details-panel {
    width: min(320px, 88vw);
  }
}
</style>
