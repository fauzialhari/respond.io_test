const NODE_SIZE = { width: 210, height: 90 };
const BRANCH_SIZE = { width: 82, height: 28 };

function getNodeSize(node) {
  return node.type === "branch" ? BRANCH_SIZE : NODE_SIZE;
}

function overlaps(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function distanceToSegment(point, start, end) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const lengthSquared = deltaX ** 2 + deltaY ** 2;

  if (!lengthSquared) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const ratio = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) /
        lengthSquared,
    ),
  );
  return Math.hypot(
    point.x - (start.x + ratio * deltaX),
    point.y - (start.y + ratio * deltaY),
  );
}

export function findNodePosition({
  bounds,
  nodes,
  edges,
  project,
  toScreen,
  reservedRight = 0,
}) {
  if (!bounds.width || !bounds.height) {
    return { x: 120, y: 120 };
  }

  const area = {
    left: bounds.left + 32,
    top: bounds.top + 96,
    right: Math.max(bounds.left + 32, bounds.right - 32 - reservedRight),
    bottom: bounds.bottom - 32,
  };
  const maxX = Math.max(area.left, area.right - NODE_SIZE.width);
  const maxY = Math.max(area.top, area.bottom - NODE_SIZE.height);
  const columns = Math.max(
    1,
    Math.floor((maxX - area.left) / (NODE_SIZE.width + 32)) + 1,
  );
  const rows = Math.max(
    1,
    Math.floor((maxY - area.top) / (NODE_SIZE.height + 32)) + 1,
  );
  const canvasCenter = {
    x: (area.left + area.right) / 2,
    y: (area.top + area.bottom) / 2,
  };
  const positions = new Map(
    nodes.map((node) => [node.id, toScreen(node.position)]),
  );
  const occupied = nodes.map((node) => ({
    ...positions.get(node.id),
    ...getNodeSize(node),
  }));
  const edgeSegments = edges
    .map((edge) => [positions.get(edge.source), positions.get(edge.target)])
    .filter(([source, target]) => source && target);

  let bestCandidate;
  let bestScore = Infinity;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const candidate = {
        x:
          columns === 1
            ? maxX
            : area.left + column * ((maxX - area.left) / (columns - 1)),
        y:
          rows === 1 ? maxY : area.top + row * ((maxY - area.top) / (rows - 1)),
        ...NODE_SIZE,
      };
      const center = {
        x: candidate.x + candidate.width / 2,
        y: candidate.y + candidate.height / 2,
      };
      const overlapScore =
        occupied.filter((node) => overlaps(candidate, node)).length * 100000;
      const edgeScore = edgeSegments.reduce(
        (score, [source, target]) =>
          score +
          Math.max(0, 120 - distanceToSegment(center, source, target)) ** 2,
        0,
      );
      const centerScore = Math.hypot(
        center.x - canvasCenter.x,
        center.y - canvasCenter.y,
      );
      const score = overlapScore + edgeScore + centerScore;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }
  }

  return project({ x: bestCandidate.x, y: bestCandidate.y });
}
