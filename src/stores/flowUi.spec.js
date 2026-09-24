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
      title: "Welcome",
      description: "",
      message: "Hello",
      attachments: ["image.jpg"],
      comment: "",
      timezone: "UTC",
      times: [],
    });
    store.detailsForm.message = "Updated hello";

    expect(store.detailsForm).toMatchObject({
      id: "message-1",
      title: "Welcome",
      message: "Updated hello",
      attachments: ["image.jpg"],
    });
    expect(store).not.toHaveProperty("getDetailsFormChanges");
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
