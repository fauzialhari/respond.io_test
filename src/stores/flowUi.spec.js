import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useFlowUiStore } from "./flowUi.js";

describe("flowUi store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("keeps shared UI state separate from the workflow query data", () => {
    const store = useFlowUiStore();

    store.selectedNodeId = "message-1";
    store.isCreateDialogOpen = true;

    expect(store.$state).toEqual({
      selectedNodeId: "message-1",
      isCreateDialogOpen: true,
      positionsByNodeId: {},
      detailsForm: null,
    });
  });

  it("stores a node detail draft separately from the workflow query data", () => {
    const store = useFlowUiStore();

    store.setDetailsForm({
      id: "message-1",
      type: "sendMessage",
      name: "Welcome",
      data: {
        payload: [
          { type: "text", text: "Hello" },
          { type: "attachment", attachment: "image.jpg" },
        ],
      },
    });
    store.detailsForm.message = "Updated hello";

    expect(store.getDetailsFormChanges()).toEqual({
      id: "message-1",
      changes: {
        name: "Welcome",
        description: "",
        data: {
          payload: [
            { type: "text", text: "Updated hello" },
            { type: "attachment", attachment: "image.jpg" },
          ],
        },
      },
    });
  });

  it("stores node positions separately from workflow data", () => {
    const store = useFlowUiStore();

    store.setNodePosition("message-1", { x: 240, y: 120 }, "LR");
    store.keepNodePositions(["message-1"]);

    expect(store.positionsByNodeId).toEqual({
      "message-1": { position: { x: 240, y: 120 }, layoutDirection: "LR" },
    });
  });
});
