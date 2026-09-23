import { flushPromises, shallowMount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import FlowCanvas from "./FlowCanvas.vue";
import CreateNodeDialog from "./CreateNodeDialog.vue";

const workflow = [
  {
    id: 1,
    parentId: -1,
    type: "trigger",
    data: { type: "conversationOpened" },
  },
  {
    id: "d09c08",
    parentId: 1,
    type: "dateTime",
    name: "Business Hours",
    data: { times: [] },
  },
  {
    id: "success",
    parentId: "d09c08",
    type: "dateTimeConnector",
    data: { connectorType: "success" },
  },
  {
    id: "detached",
    parentId: -1,
    type: "addComment",
    name: "Detached note",
    data: { comment: "" },
  },
];

const mutationMocks = vi.hoisted(() => ({
  createNode: vi.fn(),
  deleteNode: vi.fn(),
  updateNode: vi.fn(),
  retry: vi.fn(),
  isSyncError: false,
  isSyncing: false,
}));

vi.mock("../api/flowQueries.js", () => ({
  useWorkflowQuery: () => ({
    data: { value: workflow },
    createWorkflowNodeMutation: mutationMocks.createNode,
    deleteWorkflowNodeMutation: mutationMocks.deleteNode,
    error: null,
    isError: false,
    isMutationError: mutationMocks.isSyncError,
    isMutationPending: mutationMocks.isSyncing,
    isFetching: false,
    isPending: false,
    isScheduled: false,
    refetch: vi.fn(),
    retryWorkflowSave: mutationMocks.retry,
    updateWorkflowNodeMutation: mutationMocks.updateNode,
  }),
}));

describe("FlowCanvas", () => {
  const wrappers = [];

  beforeEach(() => {
    setActivePinia(createPinia());
    Object.values(mutationMocks)
      .filter((value) => typeof value === "function")
      .forEach((mock) => mock.mockClear());
    mutationMocks.isSyncError = false;
    mutationMocks.isSyncing = false;
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  async function mountCanvas(path = "/") {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", name: "flow", component: FlowCanvas },
        {
          path: "/node/:nodeId",
          name: "flow-node",
          component: FlowCanvas,
        },
      ],
    });
    await router.push(path);
    await router.isReady();
    const replace = vi.spyOn(router, "replace");

    const wrapper = shallowMount(FlowCanvas, {
      global: { plugins: [createPinia(), router] },
    });
    wrappers.push(wrapper);
    return { replace, router, wrapper };
  }

  it("passes Vue Query workflow data and parent relationships to Vue Flow", async () => {
    const { wrapper } = await mountCanvas();
    const flow = wrapper.getComponent({ name: "VueFlow" });

    expect(flow.props("nodes")).toHaveLength(workflow.length);
    expect(flow.props("edges")).toContainEqual(
      expect.objectContaining({ source: "1", target: "d09c08" }),
    );
    expect(flow.props("edges")).not.toContainEqual(
      expect.objectContaining({ target: "detached" }),
    );
  });

  it("uses the dedicated display-only node type for success and failure branches", async () => {
    const { wrapper } = await mountCanvas();
    const connector = wrapper
      .getComponent({ name: "VueFlow" })
      .props("nodes")
      .find((node) => node.id === "success");

    expect(connector).toMatchObject({
      type: "branch",
      draggable: false,
      focusable: false,
      selectable: false,
    });
  });

  it("opens the native create dialog from the create-node control", async () => {
    const { wrapper } = await mountCanvas();

    await wrapper.get(".create-button").trigger("click");

    expect(wrapper.getComponent(CreateNodeDialog).props("open")).toBe(true);
  });

  it("shows failed sync status and retries the workflow save", async () => {
    mutationMocks.isSyncError = true;
    const { wrapper } = await mountCanvas();

    expect(wrapper.text()).toContain("Changes are not saved.");
    await wrapper.get(".toolbar-copy button").trigger("click");

    expect(mutationMocks.retry).toHaveBeenCalledOnce();
  });

  it("shows node details after a Vue Flow node click", async () => {
    const { router, wrapper } = await mountCanvas();

    wrapper.getComponent({ name: "VueFlow" }).vm.$emit("node-click", {
      node: { id: "d09c08", data: { type: "dateTime" } },
    });
    await flushPromises();

    expect(wrapper.find("node-details-panel-stub").exists()).toBe(true);
    expect(router.currentRoute.value.params.nodeId).toBe("d09c08");
  });

  it("opens node details from the node ID in the URL", async () => {
    const { wrapper } = await mountCanvas("/node/d09c08");

    await wrapper.vm.$nextTick();

    expect(wrapper.find("node-details-panel-stub").exists()).toBe(true);
  });

  it("replaces an invalid node URL with the workflow route", async () => {
    const { replace, router, wrapper } = await mountCanvas(
      "/node/wrong-id",
    );

    await flushPromises();

    expect(replace).toHaveBeenCalledWith({ name: "flow" });
    expect(router.currentRoute.value.fullPath).toBe("/");
    expect(wrapper.find("node-details-panel-stub").exists()).toBe(false);
  });

  it("creates nodes without inheriting the selected node as their parent", async () => {
    const { wrapper } = await mountCanvas();
    const flow = wrapper.getComponent({ name: "VueFlow" });

    flow.vm.$emit("node-click", {
      node: { id: "d09c08", data: { type: "dateTime" } },
    });
    await wrapper.vm.$nextTick();
    wrapper.getComponent(CreateNodeDialog).vm.$emit("create", {
      name: "Detached note",
      type: "addComment",
      data: { comment: "" },
    });

    expect(mutationMocks.createNode).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Detached note",
        type: "addComment",
        data: { comment: "" },
        position: { x: 120, y: 120 },
        layoutDirection: "LR",
      }),
      expect.any(Object),
    );
  });
});
