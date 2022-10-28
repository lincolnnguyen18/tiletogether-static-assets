/** @jsx jsx */
// eslint-disable-next-line no-unused-vars
import { css, jsx } from '@emotion/react';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTilesetEditorPrimitives } from './tilesetEditorSlice';

export function TilesetCanvas () {
  const dispatch = useDispatch();
  const tilesetEditorSlice = useSelector((state) => state.tilesetEditor);
  const primitives = tilesetEditorSlice.primitives;
  const canvas = useRef(null);
  const transformContainer = useRef(null);
  const canvasWrapper = useRef(null);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleMousemove);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mousemove', handleMousemove);
    };
  }, [primitives]);

  useEffect(() => {
    const img = new Image();
    img.src = '/mock-data/file-image.png';
    img.onload = () => {
      const ctx = canvas.current.getContext('2d');
      canvas.current.width = img.width;
      canvas.current.height = img.height;
      const newVirtualScale = Math.max(
        Math.min(
          Math.floor(window.innerWidth * 2 / 10 / img.width),
          Math.floor(window.innerHeight * 2 / 10 / img.height),
        ),
        1,
      );
      canvas.current.style.transform = `scale(${newVirtualScale})`;
      dispatch(setTilesetEditorPrimitives({ virtualScale: newVirtualScale }));
      ctx.drawImage(img, 0, 0);
    };
  }, []);

  function handleMousemove (e) {
    dispatch(setTilesetEditorPrimitives({ cursor: e }));
    if (e.buttons === 1) {
      colorPixel({ r: 255, g: 0, b: 0, a: 255 });
    }
  }

  function zoom (delta) {
    // calculate current zoom point and use it to calculate the new scale
    const offset = { x: canvasWrapper.current.scrollLeft, y: canvasWrapper.current.scrollTop };
    const imageLoc = { x: primitives.cursor.pageX + offset.x, y: primitives.cursor.pageY + offset.y };
    const zoomPoint = { x: imageLoc.x / primitives.scale, y: imageLoc.y / primitives.scale };
    let newScale = primitives.scale + delta * primitives.scaleFactor * primitives.scale;
    if (newScale < 1) newScale = 1;
    if (newScale > primitives.maxScale) newScale = primitives.maxScale;
    dispatch(setTilesetEditorPrimitives({ scale: newScale }));

    // calculate new zoom point and use it to calculate the new scroll to keep the zoom point in the same place
    const zoomPointNew = { x: zoomPoint.x * newScale, y: zoomPoint.y * newScale };
    const newScroll = { x: zoomPointNew.x - primitives.cursor.pageX, y: zoomPointNew.y - primitives.cursor.pageY };
    transformContainer.current.style.transform = `scale(${newScale}, ${newScale})`;
    canvasWrapper.current.scrollTop = newScroll.y;
    canvasWrapper.current.scrollLeft = newScroll.x;
  }

  function handleKeydown (e) {
    if (e.ctrlKey) {
      if (e.key === '=') {
        e.preventDefault();
        zoom(5);
      }
      if (e.key === '-') {
        e.preventDefault();
        zoom(-5);
      }
      if (e.key === '0') {
        e.preventDefault();
        zoom(-100);
      }
    }
  }

  function handleWheel (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const delta = -1 * Math.min(Math.max(-1, e.deltaY), 1);
    zoom(delta);
  }

  function colorPixel (color) {
    const bounding = canvas.current.getBoundingClientRect();
    let x = (primitives.cursor.pageX - bounding.left) / primitives.scale / primitives.virtualScale;
    let y = (primitives.cursor.pageY - bounding.top) / primitives.scale / primitives.virtualScale;
    x = Math.floor(x);
    y = Math.floor(y);

    const ctx = canvas.current.getContext('2d');
    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    data[0] = color.r;
    data[1] = color.g;
    data[2] = color.b;
    data[3] = color.a;
    ctx.putImageData(imageData, x, y);
  }

  function handleMouseDown () {
    colorPixel({ r: 255, g: 0, b: 0, a: 255 });
  }

  return (
    <div
      id='canvas-wrapper'
      css={[canvasWrapperAndTransformContainerStyle, canvasWrapperStyle]}
      ref={canvasWrapper}
      onWheel={handleWheel}
    >
      <div
        id='transform-container'
        css={canvasWrapperAndTransformContainerStyle}
        ref={transformContainer}
      >
        <canvas
          id='canvas'
          css={canvasStyle}
          ref={canvas}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
}

const canvasWrapperStyle = css`
  height: 100%;
  overflow: scroll;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: absolute;
  width: calc(100% - 270px - 54px);
  left: 54px;
  top: 0;
`;

const canvasWrapperAndTransformContainerStyle = css`
  image-rendering: pixelated;
  transform-origin: 0 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const canvasStyle = css`
  image-rendering: pixelated;
  background: #000;
`;
