import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFlowUiStore } from "./flowUi.js";

describe("flowUi store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("keeps shared UI state separate from the workflow query data", () => {
    const store = useFlowUiStore();

    store.selectedNodeId = "message-1";
    store.isCreateDialogOpen = true;
    store.setSyncStatus("syncing");

    expect(store.$state).toEqual({
      selectedNodeId: "message-1",
      isCreateDialogOpen: true,
      syncStatus: "syncing",
      positionsByNodeId: {},
    });
  });

  it("retries the latest failed workflow save without storing its callback in state", () => {
    const retry = vi.fn();
    const store = useFlowUiStore();

    store.setSyncStatus("error", retry);
    store.retry();

    expect(store.syncStatus).toBe("error");
    expect(retry).toHaveBeenCalledOnce();
    expect(store.$state).not.toHaveProperty("retrySave");
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
