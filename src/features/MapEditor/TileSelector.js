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
  const [stageData, setStageData] = useState({ scale: 2, position: { x: 0, y: 0 } });
  const stageRef = useRef(null);
  const selectedTilesetCanvas = selectedTileset && tilesetCanvases[selectedTileset.file];
  const [gridLines, setGridLines] = useState(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [selectedTileRange, setSelectedTileRange] = useState(null);

  useEffect(() => {
    console.log('selectedTileset', selectedTileset);
    // reset stage position and scale
    setStageData({ scale: 2, position: { x: 0, y: 0 } });
    setSelectedTileRange(null);
    setSelectedTilesHighlight(null);
    setSelectionDirection(null);
    setPreviousSelectionDirection(null);
  }, [selectedTileset]);

  function handleStageMouseWheel (e) {
    e.evt.preventDefault();
    if (!selectedTilesetCanvas) return;
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

  const [selectionDirection, setSelectionDirection] = useState(null);
  const [previousSelectionDirection, setPreviousSelectionDirection] = useState(null);

  // turn above into a reusable function
  function getMouseTileCoords () {
    // return index of tile that mouse is over, null if mouse is outside of tileset
    const tileDimension = file.tileDimension;
    const stageScale = stageData.scale;
    const tilesetCanvas = selectedTilesetCanvas;
    const tilesetCanvasWidth = tilesetCanvas.width;
    const tilesetCanvasHeight = tilesetCanvas.height;
    const mousePosition = stageRef.current.getPointerPosition();
    const stagePosition = stageRef.current.position();
    // const stageScale = stageRef.current.scaleX();
    const relativeMousePos = {
      x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
      y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
    };

    // if clicked outside of tileset, return
    if (relativeMousePos.x < 0 || relativeMousePos.x >= tilesetCanvasWidth) return;
    if (relativeMousePos.y < 0 || relativeMousePos.y >= tilesetCanvasHeight) return;
    // console.log('relativeMousePos', relativeMousePos);
    // console.log('height', tilesetCanvasHeight);

    // get index of tile that was clicked
    // const tileIndex = Math.floor(relativeMousePos.x / tileDimension) + Math.floor(relativeMousePos.y / tileDimension) * (tilesetCanvasWidth / tileDimension);

    const isPos = { x: true, y: true };

    // also return x and y of tile in terms of number of tiles
    let tileX = Math.floor(relativeMousePos.x / tileDimension);
    if (selectedTileRange && selectedTileRange.start && selectedTileRange.start.tileX > tileX) {
      isPos.x = false;
    }
    let tileY = Math.floor(relativeMousePos.y / tileDimension);
    if (selectedTileRange && selectedTileRange.start && selectedTileRange.start.tileY > tileY) {
      isPos.y = false;
    }

    if (selectionDirection) {
      if (!selectionDirection.x) {
        tileX -= 1;
      }
      if (!selectionDirection.x && previousSelectionDirection.x) {
        const newSelectedTileRange = { ...selectedTileRange };
        newSelectedTileRange.start.tileX += 1;
        setSelectedTileRange(newSelectedTileRange);
      } else if (previousSelectionDirection && selectionDirection.x && !previousSelectionDirection.x) {
        const newSelectedTileRange = { ...selectedTileRange };
        newSelectedTileRange.start.tileX -= 1;
        setSelectedTileRange(newSelectedTileRange);
      }
      if (!selectionDirection.y) {
        tileY -= 1;
      }
      if (!selectionDirection.y && previousSelectionDirection.y) {
        const newSelectedTileRange = { ...selectedTileRange };
        newSelectedTileRange.start.tileY += 1;
        setSelectedTileRange(newSelectedTileRange);
      } else if (previousSelectionDirection && selectionDirection.y && !previousSelectionDirection.y) {
        const newSelectedTileRange = { ...selectedTileRange };
        newSelectedTileRange.start.tileY -= 1;
        setSelectedTileRange(newSelectedTileRange);
      }
    }

    setPreviousSelectionDirection(selectionDirection);
    setSelectionDirection(isPos);

    // // update start's tileX
    // const newSelectedTileRange = { ...selectedTileRange };
    // newSelectedTileRange.start.tileX -= 1;
    // setSelectedTileRange(newSelectedTileRange);

    return { tileX, tileY };
  }

  // useEffect(() => {
  //   if (_.isEqual(selectionDirection, previousSelectionDirection)) return;
  //
  //   console.log('selectionDirection', selectionDirection);
  //   // console.log('previousSelectionDirection', previousSelectionDirection);
  // }, [selectionDirection]);

  function handleStageMouseDown () {
    // console.log('stage mousedown', e);

    const tileInfo = getMouseTileCoords();
    if (!tileInfo) return;

    setMouseDown(true);
    setSelectedTileRange({ start: tileInfo, end: tileInfo });
  }

  function handleStageMouseMove () {
    if (!mouseDown) return;
    // console.log('stage mousemove', e);
    const tileInfo = getMouseTileCoords();
    // if outside of tileset, return
    if (!tileInfo || !selectedTileRange) return;
    setSelectedTileRange({ start: selectedTileRange.start, end: tileInfo });
  }

  function handleStageMouseUp () {
    // console.log('stage mouseup', e);
    setMouseDown(false);
    setSelectedTileRange(null);
    setSelectionDirection(null);
    setPreviousSelectionDirection(null);
  }

  // function handleStageMouseLeave () {
  //   // console.log('stage mouseleave', e);
  //   setMouseDown(false);
  //   setSelectedTileRange(null);
  // }

  const [selectedTilesHighlight, setSelectedTilesHighlight] = useState(null);

  useEffect(() => {
    // console.log('selectedTileRange', selectedTileRange);

    // draw a blue transparent rectangle over the selected tiles
    // use tileX and tileY multiplied by tileDimension to get x and y
    if (selectedTileRange && selectedTileRange.start && selectedTileRange.end) {
      setSelectedTilesHighlight(
        <Rect
          x={selectedTileRange.start.tileX * file.tileDimension}
          y={selectedTileRange.start.tileY * file.tileDimension}
          width={(selectedTileRange.end.tileX - selectedTileRange.start.tileX + 1) * file.tileDimension}
          height={(selectedTileRange.end.tileY - selectedTileRange.start.tileY + 1) * file.tileDimension}
          fill="rgba(0, 0, 255, 0.2)"
        />,
      );
    }
  }, [selectedTileRange]);

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
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      // onMouseLeave={handleStageMouseLeave}
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
        {selectedTilesHighlight}
        {gridLines}
      </Layer>
    </Stage>
  );
}
