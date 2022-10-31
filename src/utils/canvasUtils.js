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

export function rgbToHex (r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function getImageColors (imageData) {
  const data = imageData.data;
  const colors = new Set();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a === 0) continue;
    const hexColor = rgbToHex(r, g, b);
    colors.add(hexColor);
  }
  return Array.from(colors);
}

export function getRandomColor () {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}
