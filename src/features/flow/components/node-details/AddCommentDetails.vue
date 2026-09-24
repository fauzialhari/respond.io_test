<script setup>
import { storeToRefs } from "pinia";
import { useFlowUiStore } from "../../../../stores/flowUi.js";

const { detailsForm } = storeToRefs(useFlowUiStore());
</script>

<template>
  <label>Comment<textarea v-model="detailsForm.comment" rows="4"></textarea></label>
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
</style>
