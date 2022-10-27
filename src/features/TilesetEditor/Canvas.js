import React, { useState } from 'react';
import { Image, Layer, Rect, Stage } from 'react-konva';
import { useSelector } from 'react-redux';
import { getPointsBetweenTwoCoordinates } from '../../utils/canvasUtils';

function generateCheckerboard (tileDimension, width, height) {
  const tiles = [];
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const x = i * tileDimension;
      const y = j * tileDimension;
      const color = (i + j) % 2 === 0 ? 'white' : 'black';
      tiles.push(<Rect key={`${i}-${j}`} x={x} y={y} width={tileDimension} height={tileDimension} fill={color} />);
    }
  }
  return tiles;
}

// eslint-disable-next-line no-unused-vars
function randomHexColor () {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function Canvas () {
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [stageZoom, setStageZoom] = useState(8);
  // eslint-disable-next-line no-unused-vars
  const [pixels, setPixels] = useState({});
  const [lastPixel, setLastPixel] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [image, setImage] = useState(null);
  const fileSlice = useSelector((state) => state.file);
  const file = fileSlice.file;
  // const fileLayers = fileSlice.file.rootLayer.layers;

  // useEffect(() => {
  //   const newPixels = [];
  //   for (let i = 0; i < file.width * file.height * file.tileDimension; i++) {
  //     newPixels.push(null);
  //   }
  //   setPixels(newPixels);
  // }, []);

  // useEffect(() => {
  //   if (file && fileLayers) {
  //     const newLayers = fileLayers.map((file) => {
  //       const image = new window.Image();
  //       image.src = file.tilesetLayerUrl;
  //       return [<Image key={file._id} image={image} />];
  //     });
  //
  //     // put checkboard layer at the bottom
  //     newLayers.unshift([]);
  //
  //     // setActiveLayerId(fileLayers[0]._id);
  //   }
  // }, [fileLayers]);

  function handleWheel (e) {
    const dx = -e.evt.deltaX * 0.5;
    const dy = -e.evt.deltaY * 0.5;

    // if control not being pressed, pan
    if (!e.evt.ctrlKey) {
      const x = stagePosition.x + dx;
      const y = stagePosition.y + dy;
      setStagePosition({ x, y });
    // else zoom
    } else {
      const oldScale = stageZoom;

      const mousePointTo = {
        x: (e.evt.clientX - stagePosition.x) / oldScale,
        y: (e.evt.clientY - stagePosition.y) / oldScale,
      };

      const direction = -e.evt.deltaY;
      const newScale = oldScale + direction / 200 * oldScale;
      if (newScale < 1 || newScale > 30) {
        return;
      }
      setStageZoom(newScale);

      const newPos = {
        x: e.evt.clientX - mousePointTo.x * newScale,
        y: e.evt.clientY - mousePointTo.y * newScale,
      };
      setStagePosition(newPos);
    }
  }

  function handleMouseDown (e) {
    setIsDrawing(true);
    const x = Math.floor((e.evt.clientX - stagePosition.x) / stageZoom);
    const y = Math.floor((e.evt.clientY - stagePosition.y) / stageZoom);
    const newPixels = { ...pixels };
    const color = 'red';
    // newPixels[`${x}-${y}`] = randomHexColor();
    newPixels[`${x}-${y}`] = color;
    setPixels(newPixels);
    setLastPixel({ x, y, color });
    generatePixelCanvasImageFromPixels();
  }

  function handleMouseMove (e) {
    const x2 = Math.floor((e.evt.clientX - stagePosition.x) / stageZoom);
    const y2 = Math.floor((e.evt.clientY - stagePosition.y) / stageZoom);
    console.log(x2, y2);
    if (!isDrawing) {
      return;
    }
    const x1 = lastPixel.x;
    const y1 = lastPixel.y;
    if (x1 === x2 && y1 === y2) {
      return;
    }
    // newPixels[`${x2}-${y2}`] = randomHexColor();
    const newPixels = { ...pixels };
    newPixels[`${x2}-${y2}`] = 'red';

    getPointsBetweenTwoCoordinates(x1, y1, x2, y2).forEach((point) => {
      newPixels[`${point[0]}-${point[1]}`] = 'red';
    });

    setPixels(newPixels);
    setLastPixel({ x: x2, y: y2, color: 'red' });
    generatePixelCanvasImageFromPixels();
  }

  function handleMouseUp () {
    setIsDrawing(false);
    // clear pixels
    setPixels({});
    setLastPixel(null);
  }

  function generatePixelCanvasImageFromPixels () {
    const canvas = document.createElement('canvas');
    canvas.width = file.width * file.tileDimension;
    canvas.height = file.height * file.tileDimension;
    const ctx = canvas.getContext('2d');
    Object.keys(pixels).forEach((key) => {
      const [x, y] = key.split('-');
      ctx.fillStyle = pixels[key];
      ctx.fillRect(x, y, 1, 1);
    });
    // insert canvas into Konva stage
    const newImage = new window.Image();
    newImage.src = canvas.toDataURL();

    // merge newImage with current image
    const mergedImage = mergeImages(image, newImage);
    setImage(mergedImage);
  }

  function mergeImages (image1, image2) {
    const canvas = document.createElement('canvas');
    canvas.width = file.width * file.tileDimension;
    canvas.height = file.height * file.tileDimension;
    const ctx = canvas.getContext('2d');
    if (image1) {
      ctx.drawImage(image1, 0, 0);
    }
    if (image2) {
      ctx.drawImage(image2, 0, 0);
    }
    // insert canvas into Konva stage
    const newImage = new window.Image();
    newImage.src = canvas.toDataURL();
    return newImage;
  }

  // function onClickAndDrag (e) {
  //   if (e.evt.buttons !== 1) return;
  //   const newPixels = [...pixels];
  //   const x = Math.floor((e.evt.clientX - stagePosition.x) / stageZoom);
  //   const y = Math.floor((e.evt.clientY - stagePosition.y) / stageZoom);
  //   const color = randomHexColor();
  //   newPixels.push({ x, y, color });
  //   setPixels(newPixels);
  //   console.log(pixels);
  // }

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onWheel={handleWheel}
      x={stagePosition.x}
      y={stagePosition.y}
      scaleX={stageZoom}
      scaleY={stageZoom}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer imageSmoothingEnabled={false}>
        {generateCheckerboard(file.tileDimension, file.width, file.height)}
        <Image image={image} />
      </Layer>
    </Stage>
  );
}

// {Object.keys(pixels).map((key) => {
//   const [x, y] = key.split('-');
//   return (
//     <Rect
//       key={key}
//       x={Number(x)}
//       y={Number(y)}
//       width={1}
//       height={1}
//       fill={pixels[key]}
//     />
//   );
// })}
