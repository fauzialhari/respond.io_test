<script setup>
import { storeToRefs } from "pinia";
import { useFlowUiStore } from "../../../../stores/flowUi.js";

const { detailsForm } = storeToRefs(useFlowUiStore());
const businessDays = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];
</script>

<template>
  <section class="business-hours" aria-label="Business hours">
    <div class="hours-heading">
      <span>Day</span><span>Business hours</span>
    </div>
    <div
      v-for="(time, index) in detailsForm.times"
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
    <select v-model="detailsForm.timezone" aria-label="Time zone">
      <option value="UTC">(GMT+00:00) UTC</option>
    </select>
  </label>
</template>

<style scoped>
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
.time-row input,
select {
  width: 100%;
  border: 1px solid #dce3ec;
  border-radius: 7px;
  padding: 0.45rem;
  color: #334155;
  background: #f8fafc;
}
.time-row input {
  min-width: 0;
  font-size: 0.72rem;
}
.time-row span {
  color: #64748b;
  font-size: 0.7rem;
  text-align: center;
}
label {
  display: grid;
  gap: 0.42rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 750;
}
</style>
