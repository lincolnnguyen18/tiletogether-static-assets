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

export function trimPng (image) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const len = pixels.length;
  const bound = {
    top: null,
    left: null,
    right: null,
    bottom: null,
  };
  let i;
  let x;
  let y;

  // Iterate over every pixel to find the highest
  // and where it ends on every axis ()
  for (i = 0; i < len; i += 4) {
    if (pixels[i + 3] !== 0) {
      x = (i / 4) % canvas.width;
      y = ~~((i / 4) / canvas.width);

      if (bound.top === null) {
        bound.top = y;
      }

      if (bound.left === null) {
        bound.left = x;
      } else if (x < bound.left) {
        bound.left = x;
      }

      if (bound.right === null) {
        bound.right = x;
      } else if (bound.right < x) {
        bound.right = x;
      }

      if (bound.bottom === null) {
        bound.bottom = y;
      } else if (bound.bottom < y) {
        bound.bottom = y;
      }
    }
  }

  const trimHeight = bound.bottom - bound.top + 1;
  const trimWidth = bound.right - bound.left + 1;
  const trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

  canvas.width = trimWidth;
  canvas.height = trimHeight;
  ctx.putImageData(trimmed, 0, 0);

  return canvas;
}

export function getRandomColor () {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}
