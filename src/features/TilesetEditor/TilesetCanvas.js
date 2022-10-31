/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Layer, Stage } from 'react-konva';
import { assignTilesetRightSidebarPrimitives } from './rightSidebarSlice';
import { getImageColors } from '../../utils/canvasUtils';

export function KonvaCheckerboardImage ({ width, height, tileDimension }) {
  const canvas = document.createElement('canvas');
  canvas.width = width * tileDimension;
  canvas.height = height * tileDimension;
  const ctx = canvas.getContext('2d');
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#fff' : '#eee';
      ctx.fillRect(x * tileDimension, y * tileDimension, tileDimension, tileDimension);
    }
  }
  // use image to increase performance
  const image = new window.Image();
  image.src = canvas.toDataURL();
  return <Image image={image} />;
}

export function TilesetCanvas () {
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - 56 - 270);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  const [stagePosition, setStagePosition] = useState(null);
  const [stageZoom, setStageZoom] = useState(6);
  const [imageCanvas, setImageCanvas] = useState(null);
  const [image, setImage] = useState(null);
  const [panning, setPanning] = useState(false);
  const [panHover, setPanHover] = useState(false);
  const fileSlice = useSelector((state) => state.file);
  const stageRef = useRef(null);
  const file = fileSlice.file;
  const layers = file.rootLayer.layers;
  const leftSidebarSlice = useSelector((state) => state.leftSidebar);
  const showGrid = leftSidebarSlice.primitives.showGrid;
  const tilesetRightSidebarSlice = useSelector((state) => state.tilesetRightSidebar);
  const currentColor = tilesetRightSidebarSlice.primitives.currentColor;
  const dispatch = useDispatch();

  const canvasStyle = css`
    & {
      image-rendering: pixelated;
      position: absolute;
      left: 54px;
      top: 0;
      cursor: ${panHover ? 'grab' : 'default'};
    }
    
    canvas:active {
      cursor: ${panning ? 'grabbing' : 'default'};
    }
  `;

  useEffect(() => {
    const url = '/mock-data/file-image.png';
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage(img);

      // set stage position so that image is centered
      setStagePosition({
        x: canvasWidth / 2 - img.width * stageZoom / 2,
        y: canvasHeight / 2 - img.height * stageZoom / 2,
      });

      // set image's canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      setImageCanvas(canvas);
    };
  }, [layers]);

  async function handleWheel (e) {
    e.evt.preventDefault();
    const dx = -e.evt.deltaX;
    const dy = -e.evt.deltaY;
    const pos = stageRef.current.getPointerPosition();

    // if ctrl not pressed, pan
    if (!e.evt.ctrlKey) {
      // if shift pressed, pan horizontally
      if (e.evt.shiftKey) {
        setStagePosition({
          x: stagePosition.x + dy,
          y: stagePosition.y,
        });
      } else {
        setStagePosition({
          x: stagePosition.x + dx,
          y: stagePosition.y + dy,
        });
      }
    // else zoom
    } else {
      const cursorPos = {
        x: (pos.x - stagePosition.x) / stageZoom,
        y: (pos.y - stagePosition.y) / stageZoom,
      };

      const newScale = stageZoom + dy / 400 * stageZoom;
      if (newScale < 1 || newScale > 1000) return;
      setStageZoom(newScale);
      setStagePosition({
        x: pos.x - cursorPos.x * newScale,
        y: pos.y - cursorPos.y * newScale,
      });
    }
  }

  // recalculate colors of pixels of image currently in view every time stage position changes
  useEffect(() => {
    if (imageCanvas) {
      // crop image canvas to current view
      const ctx = imageCanvas.getContext('2d');
      const imageData = ctx.getImageData(
        -stagePosition.x / stageZoom,
        -stagePosition.y / stageZoom,
        canvasWidth / stageZoom,
        canvasHeight / stageZoom,
      );
      const colors = getImageColors(imageData);
      dispatch(assignTilesetRightSidebarPrimitives({ colors }));
    }
  }, [stagePosition, image]);

  function getCursorImagePos () {
    const stagePos = { x: stagePosition.x / stageZoom, y: stagePosition.y / stageZoom };
    const pos = stageRef.current.getPointerPosition();
    pos.x = Math.floor(pos.x / stageZoom - stagePos.x);
    pos.y = Math.floor(pos.y / stageZoom - stagePos.y);
    return pos;
  }

  function colorPixel () {
    const ctx = imageCanvas.getContext('2d');
    const pos = getCursorImagePos();
    ctx.fillStyle = currentColor;
    ctx.fillRect(pos.x, pos.y, 1, 1);
    const newImg = new window.Image();
    newImg.src = imageCanvas.toDataURL();
    setImage(newImg);
  }

  function erasePixel () {
    const ctx = imageCanvas.getContext('2d');
    const pos = getCursorImagePos();
    ctx.clearRect(pos.x, pos.y, 1, 1);
    const newImg = new window.Image();
    newImg.src = imageCanvas.toDataURL();
    setImage(newImg);
  }

  function handleMouseDown (e) {
    e.evt.preventDefault();
    if (e.evt.button === 1 || (panHover && e.evt.button === 0)) {
      setPanning(true);
    } else if (e.evt.button === 0) {
      if (!e.evt.shiftKey) {
        colorPixel();
      } else {
        erasePixel();
      }
    }
  }

  function handleMouseMove (e) {
    e.evt.preventDefault();
    if (panning) {
      setStagePosition({
        x: stagePosition.x + e.evt.movementX,
        y: stagePosition.y + e.evt.movementY,
      });
    } else if (e.evt.buttons === 1) {
      if (!e.evt.shiftKey) {
        colorPixel();
      } else {
        erasePixel();
      }
    }
  }

  function handleContextMenu (e) {
    e.evt.preventDefault();
  }

  const resetStagePosition = useCallback(() => {
    setStageZoom(6);
    setStagePosition({
      x: canvasWidth / 2 - image.width * 6 / 2,
      y: canvasHeight / 2 - image.height * 6 / 2,
    });
  }, [canvasWidth, canvasHeight, image, stageZoom]);

  const handleKeydown = useCallback((e) => {
    // if ctrl 0 then reset stage position
    if (e.ctrlKey && e.key === '0') {
      resetStagePosition();
    }
    // if space then pan hover
    if (e.key === ' ') {
      setPanHover(true);
    }
  }, [resetStagePosition]);

  const handleKeyUp = useCallback((e) => {
    // if space then stop pan
    if (e.key === ' ') {
      setPanHover(false);
    }
  });

  const handleResize = useCallback(() => {
    setCanvasWidth(window.innerWidth - 56 - 270);
    setCanvasHeight(window.innerHeight);
  }, [resetStagePosition]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    if (e.button === 1 || (panHover && e.button === 0)) {
      setPanning(false);
    }
  }, [panHover]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleKeydown, handleResize, handleKeyUp, handleMouseUp]);

  useEffect(() => {
    console.log(layers);
  }, [layers]);

  return stagePosition && (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      x={stagePosition.x}
      y={stagePosition.y}
      scaleX={stageZoom}
      scaleY={stageZoom}
      css={canvasStyle}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      ref={stageRef}
    >
      <Layer imageSmoothingEnabled={false} opacity={showGrid ? 1 : 0}>
        <KonvaCheckerboardImage width={file.width} height={file.height} tileDimension={file.tileDimension} />
      </Layer>
      <Layer imageSmoothingEnabled={false}>
        <Image image={image} />
      </Layer>
    </Stage>
  );
}
