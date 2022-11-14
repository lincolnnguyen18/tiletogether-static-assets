/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import { asyncPatchFile, selectLastSelectedLayer, selectLastSelectedTileSet, selectMapEditorPrimitives, selectMapFile, selectMapImage, selectTileIndex, setMapImage } from './mapEditorSlice';
import { SlideModeButtons } from './Components/SlideModeButtons';
import { getPositionAfterMove, getScale } from 'src/utils/canvasUtils';
import { MapLayers } from './Components/MapLayers';
import { floor } from 'lodash';
import { getEditTileInfo } from 'src/utils/tileUtils';

const virtualCanvasesStyle = css`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 40px;
  background: #efefef;
  overflow-y: scroll;
  transform-origin: top right;
  image-rendering: pixelated;
  gap: 24px;
  z-index: 100;
  visibility: hidden;
`;

export function MapCanvas () {
  const dispatch = useDispatch();

  const [canvasSize] = useState({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  const [stageData, setStageData] = useState({ scale: 5, position: { x: 0, y: 0 } });
  const [selectedPos, setSelectPos] = useState({ x: 0, y: 0 });
  const [slideMode, setSlideMode] = useState('Vertical');
  const [cursorStyle, setCursor] = useState('default');

  const file = useSelector(selectMapFile);
  const primitives = useSelector(selectMapEditorPrimitives);
  const mapImage = useSelector(selectMapImage);
  const selectedTileset = useSelector(selectLastSelectedTileSet);
  const selectedLayer = useSelector(selectLastSelectedLayer);
  const tileIndex = useSelector(selectTileIndex);

  const { width, height, tileDimension } = file;

  const stageRef = useRef(null);

  // #region Use Effects
  useEffect(() => {
    if (primitives.activeTool === 'select') {
      setCursor('default');
    } else if (primitives.activeTool === 'draw' || primitives.activeTool === 'erase' || primitives.activeTool === 'color-picker') {
      setCursor('crosshair');
    }
  }, [stageData.scale, primitives.activeTool]);

  useEffect(() => {
    if (!mapImage && stageRef) {
      stageRef.current.toImage({
        callback: (img) => dispatch(setMapImage(img)),
      });
    }
  }, []);
  // #endregion

  // #region Uset Input Handles
  function handleMouseDown (e) {
    e.evt.preventDefault();

    if (primitives.activeTool === 'draw' || primitives.activeTool === 'erase') {
      const tileSetIndex = primitives.activeTool === 'draw' ? tileIndex : 0;
      const tileMapIndex = selectedPos.y * width + selectedPos.x;
      if (selectedLayer && tileMapIndex < width * height) {
        console.log(file);
        const newRootLayer = getEditTileInfo(file, selectedLayer, selectedTileset, file.startIndices, tileSetIndex, tileMapIndex);
        dispatch(asyncPatchFile({ id: file.id, updates: { rootLayer: newRootLayer } }));
      }
    }
  }

  function handleMouseMove (e) {
    e.evt.preventDefault();

    const { x, y } = stageRef.current.getRelativePointerPosition();
    setSelectPos({ x: floor(x / tileDimension), y: floor(y / tileDimension) });
  }

  function handleWheel (e) {
    e.evt.preventDefault();

    if (slideMode === 'Vertical' || slideMode === 'Horizontal') {
      setStageData({ ...stageData, position: getPositionAfterMove(stageData.position, e.evt, slideMode) });
    } else if (slideMode === 'Zoom') {
      setStageData({ ...stageData, scale: getScale(stageData.scale, e.evt) });
    }
  }
  // #endregion

  return (
    <Fragment>
      <div id={'virtual-canvases'} css={virtualCanvasesStyle} />
      <SlideModeButtons slideMode={slideMode} onSwithMode={setSlideMode}/>
      <Stage
        width={canvasSize.width}
        height={canvasSize.height}
        x={stageData.position.x}
        y={stageData.position.y}
        scale={{ x: stageData.scale, y: stageData.scale }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        ref={stageRef}
        style={{ position: 'absolute', top: 0, left: 56, cursor: cursorStyle }}
      >
        <MapLayers />
        <Layer>
          <Rect
            x={selectedPos.x * tileDimension}
            y={selectedPos.y * tileDimension}
            width={tileDimension}
            height={tileDimension}
            fill="red"
            opacity={0.5}
          />
        </Layer>
      </Stage>
    </Fragment>
  );
}
