import { describe, expect, it } from "vitest";
import { layoutWorkflow } from "./layoutWorkflow.js";

describe("layoutWorkflow", () => {
  it("creates a top-down tree with sibling branches placed side by side", () => {
    const positions = layoutWorkflow(
      [
        { id: "trigger", parentId: -1 },
        { id: "hours", parentId: "trigger" },
        { id: "success", parentId: "hours" },
        { id: "failure", parentId: "hours" },
        { id: "welcome", parentId: "success" },
        { id: "away", parentId: "failure" },
      ],
      { direction: "TB" },
    );

    expect(positions.trigger.y).toBeLessThan(positions.hours.y);
    expect(positions.hours.y).toBeLessThan(positions.success.y);
    expect(positions.success.x).toBeLessThan(positions.failure.x);
    expect(positions.welcome.y).toBeGreaterThan(positions.success.y);
  });

  it("uses a left-to-right tree by default", () => {
    const positions = layoutWorkflow([
      { id: "trigger", parentId: -1 },
      { id: "hours", parentId: "trigger" },
      { id: "success", parentId: "hours" },
      { id: "failure", parentId: "hours" },
    ]);

    expect(positions.trigger.x).toBeLessThan(positions.hours.x);
    expect(positions.hours.x).toBeLessThan(positions.success.x);
    expect(positions.success.y).toBeLessThan(positions.failure.y);
  });
});
