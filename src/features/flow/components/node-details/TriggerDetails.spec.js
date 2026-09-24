import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TriggerDetails from "./TriggerDetails.vue";

describe("TriggerDetails", () => {
  it("explains the trigger-only node", () => {
    const wrapper = mount(TriggerDetails);

    expect(wrapper.text()).toContain("starts the workflow");
  });
});
