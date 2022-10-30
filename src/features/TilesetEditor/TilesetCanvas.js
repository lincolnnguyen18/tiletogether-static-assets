/** @jsx jsx */
// eslint-disable-next-line no-unused-vars
import { css, jsx } from '@emotion/react';
import { useSelector } from 'react-redux';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Layer, Stage } from 'react-konva';

const canvasStyle = css`
  image-rendering: pixelated;
  position: absolute;
  left: 54px;
  top: 0;
`;

export function TilesetCanvas () {
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - 56 - 270);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [stageZoom, setStageZoom] = useState(6);
  const [imageCanvas, setImageCanvas] = useState(null);
  const [image, setImage] = useState(null);
  const fileSlice = useSelector((state) => state.file);
  const stageRef = useRef(null);
  const layers = fileSlice.file.rootLayer.layers;

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
      setStagePosition({
        x: stagePosition.x + dx,
        y: stagePosition.y + dy,
      });
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
    ctx.fillStyle = 'red';
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
    if (e.evt.button === 0) {
      if (!e.evt.shiftKey) {
        colorPixel();
      } else {
        erasePixel();
      }
    }
  }

  function handleMouseMove (e) {
    e.evt.preventDefault();
    if (e.evt.buttons === 1) {
      if (!e.evt.shiftKey) {
        colorPixel();
      } else {
        erasePixel();
      }
    }
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
  }, [resetStagePosition]);

  const handleResize = useCallback(() => {
    setCanvasWidth(window.innerWidth - 56 - 270);
    setCanvasHeight(window.innerHeight);
  }, [resetStagePosition]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleKeydown, handleResize]);

  return (
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
      ref={stageRef}
    >
      <Layer imageSmoothingEnabled={false}>
        <Image image={image} />
      </Layer>
    </Stage>
  );
}
