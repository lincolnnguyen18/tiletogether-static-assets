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

export function initializeFreqReadCanvas () {
  // using a global canvas for frequent reads to stop console warnings
  if (window.freqReadCtx == null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    window.freqReadCanvas = canvas;
    window.freqReadCtx = ctx;
  }
}

export function initializeAElement () {
  if (window.aElement == null) {
    const aElement = document.createElement('a');
    aElement.style.display = 'none';
    document.body.appendChild(aElement);
    window.aElement = aElement;
  }
}

export function trimPng (image) {
  initializeFreqReadCanvas();
  const ctx = window.freqReadCtx;
  const canvas = window.freqReadCanvas;
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const len = pixels.length;
  const overflows = {
    top: null,
    left: null,
    right: null,
    bottom: null,
  };
  let i;
  let x;
  let y;

  // Iterate over every pixel to find the edges of the non-transparent content
  for (i = 0; i < len; i += 4) {
    if (pixels[i + 3] !== 0) {
      x = (i / 4) % canvas.width;
      y = ~~((i / 4) / canvas.width);

      if (overflows.top === null) {
        overflows.top = y;
      }

      if (overflows.left === null) {
        overflows.left = x;
      } else if (x < overflows.left) {
        overflows.left = x;
      }

      if (overflows.right === null) {
        overflows.right = x;
      } else if (overflows.right < x) {
        overflows.right = x;
      }

      if (overflows.bottom === null) {
        overflows.bottom = y;
      } else if (overflows.bottom < y) {
        overflows.bottom = y;
      }
    }
  }

  const trimHeight = overflows.bottom - overflows.top + 1;
  const trimWidth = overflows.right - overflows.left + 1;
  return {
    trimmedImageData: ctx.getImageData(overflows.left, overflows.top, trimWidth, trimHeight),
    overflows,
  };
}

export function isCompletelyTransparent (inputCanvas) {
  initializeFreqReadCanvas();
  const ctx = window.freqReadCtx;
  const canvas = window.freqReadCanvas;
  canvas.width = inputCanvas.width;
  canvas.height = inputCanvas.height;
  ctx.drawImage(inputCanvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const len = pixels.length;
  for (let i = 0; i < len; i += 4) {
    if (pixels[i + 3] !== 0) {
      return false;
    }
  }
  return true;
}

export function getRandomColor () {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function reverseColor (color) {
  initializeFreqReadCanvas();
  // calculate opposite color given a color string
  const ctx = window.freqReadCtx;
  const canvas = window.freqReadCanvas;
  canvas.width = 1;
  canvas.height = 1;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const imageData = ctx.getImageData(0, 0, 1, 1);
  const data = imageData.data;
  const r = 255 - data[0];
  const g = 255 - data[1];
  const b = 255 - data[2];
  return rgbToHex(r, g, b);
}

export function parseRgbaStr (rgbaStr) {
  const rgba = rgbaStr.match(/(\d+(\.\d+)?)/g);
  return {
    r: rgba[0],
    g: rgba[1],
    b: rgba[2],
    a: rgba[3],
  };
}

export function getRgbaStrOpacity (rgbaStr) {
  const rgba = rgbaStr.match(/(\d+(\.\d+)?)/g);
  return rgba[3];
}

export function removeRgbaOpacity (rgbaStr) {
  return rgbaStr.replace(/,\s*[\d.]+\)/, ')');
}

// export function getFirstGuids (oldGuids, newGuids, newCan)
