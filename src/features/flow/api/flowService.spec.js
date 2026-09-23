import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkflow, postWorkflowMutation } from "./flowService.js";

const payload = [
  {
    id: 1,
    parentId: -1,
    type: "trigger",
    data: { type: "conversationOpened" },
  },
  {
    id: "message",
    parentId: 1,
    type: "sendMessage",
    name: "Message",
    data: { payload: [] },
  },
];

describe("flowService", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => payload }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads the initial workflow from /payload.json", async () => {
    await expect(getWorkflow()).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith("/payload.json");
  });

  it("posts the latest workflow payload immediately", async () => {
    const latestWorkflow = [
      ...payload,
      { id: "new", parentId: -1, type: "addComment", data: {} },
    ];
    fetch.mockResolvedValue({ ok: true });
    await postWorkflowMutation(latestWorkflow);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latestWorkflow),
      },
    );
  });
});
