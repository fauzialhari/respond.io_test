import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it } from "vitest";
import BusinessHoursDetails from "./BusinessHoursDetails.vue";
import { useFlowUiStore } from "../../../../stores/flowUi.js";

describe("BusinessHoursDetails", () => {
  it("edits business hours in the shared Pinia detail draft", async () => {
    const pinia = createPinia();
    const store = useFlowUiStore(pinia);
    store.setDetailsForm({
      id: "hours",
      type: "businessHours",
      title: "Hours",
      description: "",
      message: "",
      comment: "",
      attachments: [],
      timezone: "UTC",
      times: [{ day: "mon", startTime: "09:00", endTime: "17:00" }],
    });
    const wrapper = mount(BusinessHoursDetails, {
      global: { plugins: [pinia] },
    });

    await wrapper.get('input[aria-label="Mon start time"]').setValue("08:30");

    expect(store.detailsForm.times[0].startTime).toBe("08:30");
  });
});
