import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import BranchNode from "./BranchNode.vue";

describe("BranchNode", () => {
  it("renders the success path as a display-only branch label", () => {
    const wrapper = shallowMount(BranchNode, {
      props: {
        data: { hasChildren: true, data: { connectorType: "success" } },
      },
      global: { stubs: { Handle: true } },
    });

    expect(wrapper.text()).toBe("Success");
    expect(wrapper.attributes("aria-label")).toBe("Success path");
  });
});
