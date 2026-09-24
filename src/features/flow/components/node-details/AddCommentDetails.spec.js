import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it } from "vitest";
import AddCommentDetails from "./AddCommentDetails.vue";
import { useFlowUiStore } from "../../../../stores/flowUi.js";

describe("AddCommentDetails", () => {
  it("edits the shared Pinia detail draft", async () => {
    const pinia = createPinia();
    const store = useFlowUiStore(pinia);
    store.setDetailsForm({
      id: "comment",
      type: "addComment",
      title: "Comment",
      description: "",
      message: "",
      comment: "Original comment",
      attachments: [],
      timezone: "UTC",
      times: [],
    });
    const wrapper = mount(AddCommentDetails, { global: { plugins: [pinia] } });

    await wrapper.get("textarea").setValue("Updated comment");

    expect(store.detailsForm.comment).toBe("Updated comment");
  });
});
