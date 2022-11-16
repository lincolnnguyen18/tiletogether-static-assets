/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { selectMapRightSidebarPrimitives } from './rightSidebarSlice';
import { Image, Layer, Rect, Stage } from 'react-konva';
import { selectMapFile, selectTilesetCanvases } from './mapEditorSlice';
import { KonvaCheckerboardImage } from '../TilesetEditor/TilesetCanvas';

const canvasStyle = css`
  background: #bfbfbf;
  width: 100%;
  height: 213px;
`;

export function TileSelector () {
  const rightSidebarPrimitives = useSelector(selectMapRightSidebarPrimitives);
  const { selectedTileset } = rightSidebarPrimitives;
  const tilesetCanvases = useSelector(selectTilesetCanvases);
  const file = useSelector(selectMapFile);
  const [stageData, setStageData] = useState({ scale: 5, position: { x: 0, y: 0 } });
  const stageRef = useRef(null);
  const selectedTilesetCanvas = selectedTileset && tilesetCanvases[selectedTileset.file];
  const [gridLines, setGridLines] = useState(null);

  useEffect(() => {
    console.log('selectedTileset', selectedTileset);
  }, [selectedTileset]);

  function handleStageMouseWheel (e) {
    e.evt.preventDefault();
    // if deltaY is abnormally large then ignore it
    if (Math.abs(e.evt.deltaY) > 1000) return;

    // if ctrl is not pressed, pan
    if (!e.evt.ctrlKey) {
      // if shift pressed, pan horizontally
      if (e.evt.shiftKey) {
        setStageData({
          ...stageData,
          position: {
            x: stageData.position.x - e.evt.deltaY,
            y: stageData.position.y,
          },
        });
      } else {
        setStageData({
          ...stageData,
          position: {
            x: stageData.position.x - e.evt.deltaX,
            y: stageData.position.y - e.evt.deltaY,
          },
        });
      }
      // else zoom
    } else {
      const pointer = stageRef.current.getPointerPosition();
      const stage = stageRef.current.position();
      const scale = stageRef.current.scaleX();
      const pointerPosition = {
        x: (pointer.x - stage.x) / scale,
        y: (pointer.y - stage.y) / scale,
      };
      // calculate new scale
      const newScale = stageData.scale - e.evt.deltaY / 400 * stageData.scale;
      // calculate new stage position so that viewport doesn't jump
      const newStagePosition = {
        x: pointer.x - pointerPosition.x * newScale,
        y: pointer.y - pointerPosition.y * newScale,
      };
      // limit max and min zoom
      if (newScale < 0.1 || newScale > 1000) return;
      setStageData({
        ...stageData,
        scale: newScale,
        position: newStagePosition,
      });
    }
  }

  useEffect(() => {
    if (!file || !selectedTileset) return;
    const tileDimension = file.tileDimension;
    const stageScale = stageData.scale;
    const tilesetCanvas = selectedTilesetCanvas;
    const tilesetCanvasWidth = tilesetCanvas.width;
    const tilesetCanvasHeight = tilesetCanvas.height;
    const gridMinZoomScale = 2;

    const newGridLines = [];
    const lineColor = '#efefef';
    // const lineColor = 'red';
    for (let i = 0; i <= tilesetCanvasWidth; i += tileDimension) {
      newGridLines.push(
        <Rect
          key={`${i}-vertical`}
          x={i}
          y={0}
          // disappear once stage is less than n
          width={stageScale < gridMinZoomScale ? 0 : 1 / stageScale}
          height={tilesetCanvasHeight}
          fill={lineColor}
        />,
      );
    }
    for (let i = 0; i <= tilesetCanvasHeight; i += tileDimension) {
      newGridLines.push(
        <Rect
          key={`${i}-horizontal`}
          x={0}
          y={i}
          width={tilesetCanvasWidth}
          height={stageScale < gridMinZoomScale ? 0 : 1 / stageScale}
          fill={lineColor}
        />,
      );
    }
    setGridLines(newGridLines);
  }, [selectedTilesetCanvas, stageData.scale]);

  return (
    <Stage
      width={254}
      height={213}
      css={canvasStyle}
      ref={stageRef}
      x={stageData.position.x}
      y={stageData.position.y}
      scale={{ x: stageData.scale, y: stageData.scale }}
      onWheel={handleStageMouseWheel}
    >
      <Layer imageSmoothingEnabled={false}>
        {selectedTilesetCanvas && file && (
          <KonvaCheckerboardImage
            width={selectedTilesetCanvas.width / file.tileDimension}
            height={selectedTilesetCanvas.height / file.tileDimension}
            tileDimension={file.tileDimension}
          />
        )}
        <Image image={selectedTileset && tilesetCanvases[selectedTileset.file]} />
        {gridLines}
      </Layer>
    </Stage>
  );
}
