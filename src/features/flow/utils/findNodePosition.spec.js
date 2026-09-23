import { describe, expect, it } from "vitest";
import { findNodePosition } from "./findNodePosition.js";

const bounds = {
  left: 0,
  top: 0,
  right: 1000,
  bottom: 600,
  width: 1000,
  height: 600,
};
const identity = (position) => position;

describe("findNodePosition", () => {
  it("chooses a visible position that does not overlap an existing node", () => {
    const position = findNodePosition({
      bounds,
      nodes: [
        { id: "existing", type: "workflow", position: { x: 516, y: 223 } },
      ],
      edges: [],
      project: identity,
      toScreen: identity,
    });

    const overlapsExistingNode =
      position.x < 726 &&
      position.x + 210 > 516 &&
      position.y < 313 &&
      position.y + 90 > 223;

    expect(overlapsExistingNode).toBe(false);
    expect(position.x).toBeGreaterThanOrEqual(32);
    expect(position.y).toBeGreaterThanOrEqual(96);
  });

  it("prefers a position away from existing edge paths", () => {
    const position = findNodePosition({
      bounds,
      nodes: [
        { id: "source", type: "workflow", position: { x: 40, y: 205 } },
        { id: "target", type: "workflow", position: { x: 750, y: 205 } },
      ],
      edges: [{ source: "source", target: "target" }],
      project: identity,
      toScreen: identity,
    });

    expect(Math.abs(position.y + 45 - 250)).toBeGreaterThan(100);
  });
});
