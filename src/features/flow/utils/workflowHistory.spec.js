import { QueryClient } from "@tanstack/vue-query";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { workflowQueryKey } from "../api/flowQueries.js";
import { useFlowUiStore } from "../../../stores/flowUi.js";
import { createWorkflowHistory } from "./workflowHistory.js";

describe("createWorkflowHistory", () => {
  let flowUi;
  let queryClient;
  let scheduleWorkflowSave;

  beforeEach(() => {
    setActivePinia(createPinia());
    flowUi = useFlowUiStore();
    queryClient = new QueryClient();
    scheduleWorkflowSave = vi.fn();
    queryClient.setQueryData(workflowQueryKey, [{ id: "trigger" }]);
    flowUi.setNodePosition("trigger", { x: 0, y: 0 }, "LR");
  });

  it("restores workflow data and positions with undo and redo", () => {
    const history = createWorkflowHistory({
      flowUi,
      queryClient,
      scheduleWorkflowSave,
    });

    history.recordChange(() => {
      queryClient.setQueryData(workflowQueryKey, [
        { id: "trigger" },
        { id: "message" },
      ]);
      flowUi.setNodePosition("message", { x: 280, y: 0 }, "LR");
    });

    expect(history.canUndo.value).toBe(true);
    expect(history.canRedo.value).toBe(false);

    history.undo();
    expect(queryClient.getQueryData(workflowQueryKey)).toEqual([
      { id: "trigger" },
    ]);
    expect(flowUi.positionsByNodeId).toEqual({
      trigger: { position: { x: 0, y: 0 }, layoutDirection: "LR" },
    });
    expect(scheduleWorkflowSave).toHaveBeenCalledOnce();

    history.redo();
    expect(queryClient.getQueryData(workflowQueryKey)).toEqual([
      { id: "trigger" },
      { id: "message" },
    ]);
    expect(flowUi.positionsByNodeId.message).toEqual({
      position: { x: 280, y: 0 },
      layoutDirection: "LR",
    });
    expect(scheduleWorkflowSave).toHaveBeenCalledTimes(2);
  });

  it("clears redo history after a new change", () => {
    const history = createWorkflowHistory({
      flowUi,
      queryClient,
      scheduleWorkflowSave,
    });

    history.recordChange(() => {
      flowUi.setNodePosition("trigger", { x: 100, y: 0 }, "LR");
    });
    history.undo();
    history.recordChange(() => {
      flowUi.setNodePosition("trigger", { x: 200, y: 0 }, "LR");
    });

    expect(history.canRedo.value).toBe(false);
  });

  it("keeps only the 50 most recent snapshots", () => {
    const history = createWorkflowHistory({
      flowUi,
      queryClient,
      scheduleWorkflowSave,
    });

    for (let x = 1; x <= 51; x += 1) {
      history.recordChange(() => {
        flowUi.setNodePosition("trigger", { x, y: 0 }, "LR");
      });
    }

    for (let count = 0; count < 49; count += 1) {
      history.undo();
    }

    expect(history.canUndo.value).toBe(false);
    expect(flowUi.positionsByNodeId.trigger.position).toEqual({ x: 2, y: 0 });
  });
});
