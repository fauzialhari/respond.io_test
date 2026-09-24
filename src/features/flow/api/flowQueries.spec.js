import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WORKFLOW_AUTOSAVE_DELAY,
  workflowQueryKey,
  useWorkflowQuery,
} from "./flowQueries.js";

describe("flowQueries", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("updates the shared Vue Query payload and posts only after the autosave delay", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );
    const workflow = [
      {
        id: "message",
        parentId: 1,
        type: "sendMessage",
        name: "Original",
        data: { payload: [] },
      },
    ];
    queryClient.setQueryData(workflowQueryKey, workflow);

    let workflowQuery;
    const TestHost = defineComponent({
      setup() {
        workflowQuery = useWorkflowQuery();
        return () => h("div");
      },
    });

    mount(TestHost, {
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });

    expect(workflowQuery.data.value[0]).toMatchObject({
      id: "message",
      title: "Original",
      description: "",
      message: "",
      attachments: [],
    });

    workflowQuery.updateWorkflowNodeMutation({
      id: "message",
      title: "Updated",
      description: "",
      message: "",
      attachments: [],
    });

    expect(queryClient.getQueryData(workflowQueryKey)).toEqual([
      expect.objectContaining({ id: "message", name: "Updated" }),
    ]);
    expect(fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(WORKFLOW_AUTOSAVE_DELAY);

    expect(fetch).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            id: "message",
            parentId: 1,
            type: "sendMessage",
            name: "Updated",
            data: { payload: [] },
            description: "",
          },
        ]),
      },
    );
    expect(queryClient.getQueryData(workflowQueryKey)).toEqual([
      {
        id: "message",
        parentId: 1,
        type: "sendMessage",
        name: "Updated",
        data: { payload: [] },
        description: "",
      },
    ]);
  });

  it("resets autosave when another workflow change happens before the delay", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    queryClient.setQueryData(workflowQueryKey, [
      {
        id: "message",
        parentId: 1,
        type: "sendMessage",
        name: "Original",
        data: { payload: [] },
      },
    ]);

    let workflowQuery;
    const TestHost = defineComponent({
      setup() {
        workflowQuery = useWorkflowQuery();
        return () => h("div");
      },
    });

    mount(TestHost, {
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });

    workflowQuery.updateWorkflowNodeMutation({
      id: "message",
      title: "First edit",
      description: "",
      message: "",
      attachments: [],
    });
    await vi.advanceTimersByTimeAsync(WORKFLOW_AUTOSAVE_DELAY - 1);
    workflowQuery.updateWorkflowNodeMutation({
      id: "message",
      title: "Final edit",
      description: "",
      message: "",
      attachments: [],
    });

    expect(fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(WORKFLOW_AUTOSAVE_DELAY - 1);

    expect(fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(fetch).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts",
      expect.objectContaining({
        body: JSON.stringify([
          {
            id: "message",
            parentId: 1,
            type: "sendMessage",
            name: "Final edit",
            data: { payload: [] },
            description: "",
          },
        ]),
      }),
    );
  });

  it("creates nodes without a parent connection in the Query Client", () => {
    queryClient.setQueryData(workflowQueryKey, [
      { id: 1, parentId: -1, type: "trigger", data: {} },
    ]);
    let workflowQuery;

    mount(
      defineComponent({
        setup() {
          workflowQuery = useWorkflowQuery();
          return () => h("div");
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
    );

    const updatedWorkflow = workflowQuery.createWorkflowNodeMutation({
      name: "Detached note",
      type: "addComment",
    });

    const createdNode = queryClient.getQueryData(workflowQueryKey).at(-1);
    expect(createdNode).toMatchObject({
      parentId: -1,
      type: "addComment",
      name: "Detached note",
    });
    expect(updatedWorkflow).toEqual(queryClient.getQueryData(workflowQueryKey));
  });

  it("deletes the selected node and every descendant in the Query Client", () => {
    const workflow = [
      { id: 1, parentId: -1, type: "trigger", data: {} },
      { id: "message", parentId: 1, type: "sendMessage", data: {} },
      { id: "child", parentId: "message", type: "addComment", data: {} },
    ];
    queryClient.setQueryData(workflowQueryKey, workflow);
    let workflowQuery;

    mount(
      defineComponent({
        setup() {
          workflowQuery = useWorkflowQuery();
          return () => h("div");
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
    );

    workflowQuery.deleteWorkflowNodeMutation("message");

    expect(queryClient.getQueryData(workflowQueryKey)).toEqual([workflow[0]]);
  });
});
