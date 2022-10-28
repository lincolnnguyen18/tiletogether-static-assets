export function getPointsBetweenTwoCoordinates (x1, y1, x2, y2) {
  const points = [];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x1 + dx * i / steps);
    const y = Math.round(y1 + dy * i / steps);
    points.push([x, y]);
  }
  return points;
}
