function getNodeId(node) {
  return String(node.id);
}

export function layoutWorkflow(
  workflow,
  { direction = "LR", rankGap = 280, siblingGap = 220 } = {},
) {
  const nodeById = new Map(workflow.map((node) => [getNodeId(node), node]));
  const childrenById = new Map();
  const rootIds = [];

  workflow.forEach((node) => {
    const nodeId = getNodeId(node);
    const parentId = String(node.parentId);

    if (node.parentId === -1 || !nodeById.has(parentId)) {
      rootIds.push(nodeId);
      return;
    }

    const children = childrenById.get(parentId) ?? [];
    children.push(nodeId);
    childrenById.set(parentId, children);
  });

  const positions = {};
  let nextColumn = 0;

  function placeNode(nodeId, depth) {
    const children = childrenById.get(nodeId) ?? [];
    let column;

    if (children.length === 0) {
      column = nextColumn;
      nextColumn += 1;
    } else {
      const childColumns = children.map((childId) =>
        placeNode(childId, depth + 1),
      );
      column = (childColumns[0] + childColumns.at(-1)) / 2;
    }

    positions[nodeId] =
      direction === "TB"
        ? { x: column * siblingGap, y: depth * rankGap }
        : { x: depth * rankGap, y: column * siblingGap };

    return column;
  }

  rootIds.forEach((rootId) => placeNode(rootId, 0));

  return positions;
}
