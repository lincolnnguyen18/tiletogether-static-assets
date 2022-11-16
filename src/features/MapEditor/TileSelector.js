/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { selectMapRightSidebarPrimitives, setMapRightSidebarPrimitives } from './rightSidebarSlice';
import { Image, Layer, Rect, Stage } from 'react-konva';
import { selectMapFile, selectTilesetCanvases, setBrushCanvas } from './mapEditorSlice';
import { KonvaCheckerboardImage } from '../TilesetEditor/TilesetCanvas';
import _ from 'lodash';

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
  // const selectedTilesetCanvas = selectedTileset && tilesetCanvases[selectedTileset.file];
  const [gridLines, setGridLines] = useState(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [selectedTileRange, setSelectedTileRange] = useState(null);
  const dispatch = useDispatch();
  const [selectedTilesetCanvas, setSelectedTilesetCanvas] = useState(null);

  useEffect(() => {
    setSelectedTilesetCanvas(selectedTileset && tilesetCanvases[selectedTileset.file]);
  }, [selectedTileset, tilesetCanvases]);

  useEffect(() => {
    if (file.tilesets.length > 0 && selectedTileset == null) {
      dispatch(setMapRightSidebarPrimitives({ selectedTileset: file.tilesets[0] }));
    }
  }, [file.tilesets]);

  useEffect(() => {
    // console.log('selectedTileset', selectedTileset);
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
    if (!tileInfo) {
      setSelectedTileRange(null);
      setSelectionDirection(null);
      setPreviousSelectionDirection(null);
      setSelectedRect(null);
      setSelectedTilesHighlight(null);
      console.log('cleared');
      dispatch(setBrushCanvas(null));
      return;
    }

    setMouseDown(true);
    setSelectedTileRange({ start: tileInfo, end: tileInfo });
  }

  function handleStageMouseMove () {
    if (!mouseDown) return;
    // console.log('stage mousemove', e);
    const tileInfo = getMouseTileCoords();
    // if outside of tileset, return
    if (!tileInfo || !selectedTileRange || !selectedRect) return;
    setSelectedTileRange({ start: selectedTileRange.start, end: tileInfo });
  }

  function handleStageMouseUp () {
    // console.log('stage mouseup', e);
    if (!mouseDown || !selectedRect) return;
    const tileInfo = getMouseTileCoords();
    // console.log('tileInfo', tileInfo);
    if (!tileInfo || !selectedTileRange) return;

    let selectedRect2 = selectedRect;

    // if start equals end
    if (_.isEqual(selectedTileRange.start, selectedTileRange.end)) {
      // console.log('start equals end');
      setSelectedTileRange({ start: selectedTileRange.start, end: tileInfo });
      // console.log('selectedTileRange', selectedTileRange);
      selectedRect2 = {
        x: tileInfo.tileX * file.tileDimension,
        y: tileInfo.tileY * file.tileDimension,
        width: file.tileDimension,
        height: file.tileDimension,
      };
    }

    setMouseDown(false);
    setSelectedTileRange(null);
    setSelectionDirection(null);
    setPreviousSelectionDirection(null);

    // get part of tileset canvas that is selected
    // console.log('new selection', selectedRect2);
    const ctx = selectedTilesetCanvas.getContext('2d');
    const selectedImage = ctx.getImageData(selectedRect2.x, selectedRect2.y, selectedRect2.width, selectedRect2.height);
    const newCanvas = document.createElement('canvas');
    newCanvas.width = Math.abs(selectedRect2.width);
    newCanvas.height = Math.abs(selectedRect2.height);
    const newCtx = newCanvas.getContext('2d');
    newCtx.putImageData(selectedImage, 0, 0);
    dispatch(setBrushCanvas(newCanvas));
    // const w = window.open();
    // w.document.body.appendChild(newCanvas);
    // w.document.close();
  }

  // function handleStageMouseLeave () {
  //   // console.log('stage mouseleave', e);
  //   setMouseDown(false);
  //   setSelectedTileRange(null);
  // }

  const [selectedTilesHighlight, setSelectedTilesHighlight] = useState(null);
  const [selectedRect, setSelectedRect] = useState(null);

  useEffect(() => {
    // console.log('selectedTileRange', selectedTileRange);

    // draw a blue transparent rectangle over the selected tiles
    // use tileX and tileY multiplied by tileDimension to get x and y
    if (selectedTileRange && selectedTileRange.start && selectedTileRange.end) {
      const selectedRect = {
        x: selectedTileRange.start.tileX * file.tileDimension,
        y: selectedTileRange.start.tileY * file.tileDimension,
        width: (selectedTileRange.end.tileX - selectedTileRange.start.tileX + 1) * file.tileDimension,
        height: (selectedTileRange.end.tileY - selectedTileRange.start.tileY + 1) * file.tileDimension,
      };
      setSelectedRect(selectedRect);
      // console.log('selectedRect', selectedRect);
      setSelectedTilesHighlight(
        <Rect
          x={selectedRect.x}
          y={selectedRect.y}
          width={selectedRect.width}
          height={selectedRect.height}
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
      style={{ cursor: 'crosshair' }}
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
