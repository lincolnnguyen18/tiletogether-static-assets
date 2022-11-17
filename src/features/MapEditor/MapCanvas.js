/** @jsx jsx */
import { jsx } from '@emotion/react';
import { Group, Image, Layer, Rect, Stage } from 'react-konva';
import { useEffect, useRef, useState } from 'react';
import { KonvaCheckerboardImage } from '../TilesetEditor/TilesetCanvas';
import { useDispatch, useSelector } from 'react-redux';
import { selectLeftSidebarPrimitives } from '../Editor/leftSidebarSlice';
import { selectBrushCanvas, selectLastSelectedLayer, selectMapEditorPrimitives, selectMapFile, setMapEditorPrimitives, updateAllLayers, updateLayer, updateLayersUpToRoot } from './mapEditorSlice';
import { setTilesetEditorPrimitives } from '../TilesetEditor/tilesetEditorSlice';

export function MapCanvas () {
  const { showGrid } = useSelector(selectLeftSidebarPrimitives);
  const { activeTool } = useSelector(selectMapEditorPrimitives);
  const file = useSelector(selectMapFile);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  const [stageData, setStageData] = useState({ scale: 2, position: { x: 0, y: 0 } });
  const [cursorStyle, setCursorStyle] = useState('crosshair');
  const stageRef = useRef();
  const [dragging, setDragging] = useState(false);
  const lastSelectedLayer = useSelector(selectLastSelectedLayer);
  const brushCanvas = useSelector(selectBrushCanvas);
  const [brushOutline, setBrushOutline] = useState(null);
  const [layerData, setLayerData] = useState({ });
  const [relativeTilePosition, setRelativeTilePosition] = useState(null);
  const [layerElements, setLayerElements] = useState([]);
  const [hoveredRect, setHoveredRect] = useState(null);
  const [hoverLayerId, setHoverLayerId] = useState(null);
  const [selectedRects, setSelectedRects] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const layers = file.rootLayer.layers;
  const dispatch = useDispatch();

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

  function handleStageMouseMove (e) {
    if (['draw', 'erase'].includes(activeTool)) {
      setCursorStyle('crosshair');
    }
    updateBrushOutline();

    const hoverLayerId = e.target.attrs.name;
    const hoveredLayer = layerData[hoverLayerId];
    // console.log('hoverLayerId', hoverLayerId);
    // console.log('hoveredLayer', hoveredLayer);
    // console.log(dragging);
    if (e.target.image !== undefined && activeTool === 'select' && !dragging && hoveredLayer) {
      const alreadySelected = selectedRects.find((rect) => rect.key === hoveredLayer._id) !== undefined;
      if (alreadySelected) return;
      setHoveredRect(
        <Rect
          x={hoveredLayer.position.x}
          y={hoveredLayer.position.y}
          width={hoveredLayer.canvas.width}
          height={hoveredLayer.canvas.height}
          stroke='blue'
          strokeWidth={2 / stageData.scale}
          dash={[10 / stageData.scale, 10 / stageData.scale]}
          listening={false}
          key={hoveredLayer._id}
        />,
      );
      setHoverLayerId(hoverLayerId);
    } else {
      setHoveredRect(null);
      setHoverLayerId(null);
    }

    if (activeTool === 'select' && dragging) {
      const layerId = lastSelectedLayer._id;
      const mousePosition = stageRef.current.getPointerPosition();
      const stagePosition = stageRef.current.position();
      const stageScale = stageRef.current.scaleX();
      const relativeMousePos = {
        x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
        y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
      };
      // round to nearest tile
      relativeMousePos.x = Math.floor(relativeMousePos.x / file.tileDimension) * file.tileDimension;
      relativeMousePos.y = Math.floor(relativeMousePos.y / file.tileDimension) * file.tileDimension;
      const layer = layerData[layerId];

      if (dragging) {
        const newLayer = {
          ...layer,
          position: {
            x: relativeMousePos.x - dragStartPosition.x,
            y: relativeMousePos.y - dragStartPosition.y,
          },
        };
        setLayerData({
          ...layerData,
          [layerId]: newLayer,
        });
      }
    }
  }

  const handleStageMouseUp = () => {
    setDragging(false);
    setDragStartPosition(null);
  };

  function handleStageMouseDown (e) {
    if (lastSelectedLayer && (
      activeTool === 'draw' || activeTool === 'eraser'
    )) {
      // console.log('updateLayer');
      paintTilesetOnCanvas(lastSelectedLayer._id, e);
    } else if (e.target.attrs.name === undefined && activeTool === 'select') {
      // clear selection if click on stage
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: null }));
    }
  }

  function paintTilesetOnCanvas (layerId, e) {
    const mousePosition = stageRef.current.getPointerPosition();
    const stagePosition = stageRef.current.position();
    const stageScale = stageRef.current.scaleX();
    const relativeMousePos = {
      x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
      y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
    };
    // get relativeMousePos in tiles (file.tileDimension)
    // const relativeMousePosInTiles = {
    //   x: Math.floor(relativeMousePos.x / file.tileDimension),
    //   y: Math.floor(relativeMousePos.y / file.tileDimension),
    // };

    let layer = layerData[layerId];
    let layerPosition = layer ? { x: layer.position.x, y: layer.position.y } : null;
    if (!layerPosition) {
      layerPosition = relativeTilePosition;
    }
    if (!layerPosition) return;
    let layerCanvas = layer ? layer.canvas : null;
    // console.log('layerCanvas', layerCanvas);
    if (!layerCanvas && brushCanvas) {
      layerCanvas = document.createElement('canvas');
      layerCanvas.width = brushCanvas.width;
      layerCanvas.height = brushCanvas.height;
    }

    // console.log('relativeTilePosition', relativeTilePosition);
    // console.log('layerPosition', layerPosition);

    const relativeLayerPosition = {
      x: layerPosition.x / file.tileDimension,
      y: layerPosition.y / file.tileDimension,
    };

    const overflows = {
      left: Math.min(0, relativeTilePosition.x - relativeLayerPosition.x),
      right: Math.max(0, (relativeTilePosition.x + brushCanvas.width / file.tileDimension) - (relativeLayerPosition.x + layerCanvas.width / file.tileDimension)),
      top: Math.min(0, relativeTilePosition.y - relativeLayerPosition.y),
      bottom: Math.max(0, (relativeTilePosition.y + brushCanvas.height / file.tileDimension) - (relativeLayerPosition.y + layerCanvas.height / file.tileDimension)),
    };
    overflows.left *= -1;
    overflows.top *= -1;

    let brushRect;
    // console.log('overflows', overflows);

    if ((overflows.left > 0 || overflows.right > 0 || overflows.top > 0 || overflows.bottom > 0) && e.evt.shiftKey && activeTool === 'draw') {
      // console.log('overflow');
      const newCanvas = document.createElement('canvas');
      const newCtx = newCanvas.getContext('2d');
      const ctx = layerCanvas.getContext('2d');
      const newCanvasWidth = layerCanvas.width + (overflows.left + overflows.right) * file.tileDimension;
      const newCanvasHeight = layerCanvas.height + (overflows.top + overflows.bottom) * file.tileDimension;
      // console.log('newCanvasWidth', newCanvasWidth);
      // console.log('newCanvasHeight', newCanvasHeight);

      newCanvas.width = newCanvasWidth;
      newCanvas.height = newCanvasHeight;
      newCtx.drawImage(layerCanvas, overflows.left * file.tileDimension, overflows.top * file.tileDimension);

      brushRect = {
        y: (relativeTilePosition.y + overflows.top - relativeLayerPosition.y) * file.tileDimension,
        x: (relativeTilePosition.x + overflows.left - relativeLayerPosition.x) * file.tileDimension,
        width: brushCanvas.width,
        height: brushCanvas.height,
      };
      console.log('brushRect', brushRect);

      layer.canvas.width = newCanvasWidth;
      layer.canvas.height = newCanvasHeight;
      ctx.drawImage(newCanvas, 0, 0);

      // clear tiles below brush
      ctx.clearRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);

      if (activeTool === 'draw') {
        ctx.drawImage(brushCanvas, brushRect.x, brushRect.y);
      }

      // determine new layer position
      const newLayerPosition = {
        x: Math.min(layerPosition.x, relativeTilePosition.x * file.tileDimension),
        y: Math.min(layerPosition.y, relativeTilePosition.y * file.tileDimension),
      };
      // console.log('newLayerPosition', newLayerPosition);

      const newLayerData = { ...layerData };
      newLayerData[layerId] = {
        ...newLayerData[layerId],
        position: newLayerPosition,
        canvas: layerCanvas,
      };
      setLayerData(newLayerData);
      stageRef.current.draw();
    } else if (!layer || layer.canvas == null) {
      brushRect = {
        x: (relativeTilePosition.x - layerPosition.x) * file.tileDimension,
        y: (relativeTilePosition.y - layerPosition.y) * file.tileDimension,
        width: brushCanvas.width,
        height: brushCanvas.height,
      };
      console.log('brushRect', brushRect);

      const ctx = layerCanvas.getContext('2d', { desynchronized: true });
      ctx.clearRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
      if (activeTool === 'draw') {
        ctx.drawImage(brushCanvas, brushRect.x, brushRect.y);
      }

      const newLayerData = { ...layerData };
      if (!layer) {
        newLayerData[layerId] = {
          canvas: layerCanvas,
          position: {
            x: relativeTilePosition.x * file.tileDimension,
            y: relativeTilePosition.y * file.tileDimension,
          },
        };
        // console.log('newLayerData', newLayerData);
      }

      // update layerData
      setLayerData(newLayerData);
    } else {
      console.log('drawing on old canvas');
      brushRect = {
        x: (relativeTilePosition.x - relativeLayerPosition.x) * file.tileDimension,
        y: (relativeTilePosition.y - relativeLayerPosition.y) * file.tileDimension,
        width: brushCanvas.width,
        height: brushCanvas.height,
      };
      console.log('brushRect', brushRect);

      const ctx = layerCanvas.getContext('2d', { desynchronized: true });
      ctx.clearRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
      if (activeTool === 'draw') {
        ctx.drawImage(brushCanvas, brushRect.x, brushRect.y);
      }

      const newLayerData = { ...layerData };
      newLayerData[layerId] = {
        ...layer,
        canvas: layerCanvas,
      };
      setLayerData(newLayerData);
    }
  }

  useEffect(() => {
    const newSelectedRects = [];
    function traverse (layer) {
      if (layer.type === 'layer' && layer.selected && layerData[layer._id]) {
        newSelectedRects.push(
          <Rect
            x={layerData[layer._id].position.x}
            y={layerData[layer._id].position.y}
            width={layerData[layer._id].canvas.width}
            height={layerData[layer._id].canvas.height}
            stroke='red'
            strokeWidth={2 / stageData.scale}
            dash={[10 / stageData.scale, 10 / stageData.scale]}
            listening={false}
            key={layer._id}
          />,
        );
      }
      layer.layers.forEach(traverse);
    }
    if (!file || !file.rootLayer) return;
    traverse(file.rootLayer);
    setSelectedRects(newSelectedRects);

    // remove hover rect if hoverLayerId not in newSelectedRects (to prevent ghost hover rect after deleting a layer)
    if (hoverLayerId && !newSelectedRects.find((rect) => rect.key === hoverLayerId)) {
      setHoveredRect(null);
      setHoverLayerId(null);
    }
  }, [layers, layerData, stageData.scale]);

  useEffect(() => {
    updateBrushOutline();
    setHoveredRect(null);
    setHoverLayerId(null);
  }, [stageData.scale]);

  function updateBrushOutline () {
    if (brushCanvas) {
      const mousePosition = stageRef.current.getPointerPosition();
      const stagePosition = stageRef.current.position();
      const stageScale = stageRef.current.scaleX();
      const relativeMousePos = {
        x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
        y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
      };
      // floor relative mouse position with respect to file.tileDimension
      const tileDimension = file.tileDimension;
      const tilePosition = {
        x: Math.floor(relativeMousePos.x / tileDimension) * tileDimension,
        y: Math.floor(relativeMousePos.y / tileDimension) * tileDimension,
      };
      // center tilePosition with respect to brushCanvas
      tilePosition.x -= Math.floor(Math.floor(brushCanvas.width / 2) / tileDimension) * tileDimension;
      tilePosition.y -= Math.floor(Math.floor(brushCanvas.height / 2) / tileDimension) * tileDimension;
      setRelativeTilePosition({
        x: tilePosition.x / tileDimension,
        y: tilePosition.y / tileDimension,
      });
      if (['draw', 'erase'].includes(activeTool)) {
        const newBrushOutline = [];
        const outerStrokeColor = 'black';
        const innerStrokeColor = 'white';
        newBrushOutline.push(
          <Rect
            x={tilePosition.x}
            y={tilePosition.y}
            width={brushCanvas.width}
            height={brushCanvas.height}
            stroke={outerStrokeColor}
            strokeWidth={2 / stageData.scale}
            // dash={[10 / stageData.scale, 10 / stageData.scale]}
            listening={false}
            key={1}
          />,
        );
        newBrushOutline.push(
          <Rect
            x={tilePosition.x + 2 / stageData.scale}
            y={tilePosition.y + 2 / stageData.scale}
            width={brushCanvas.width - 4 / stageData.scale}
            height={brushCanvas.height - 4 / stageData.scale}
            stroke={innerStrokeColor}
            strokeWidth={2 / stageData.scale}
            // dash={[10 / stageData.scale, 10 / stageData.scale]}
            listening={false}
            key={2}
          />,
        );
        if (activeTool === 'draw') {
          newBrushOutline.push(
            <Image
              image={brushCanvas}
              x={tilePosition.x}
              y={tilePosition.y}
              width={brushCanvas.width}
              height={brushCanvas.height}
              opacity={1}
              listening={false}
              key={3}
            />,
          );
        }
        setBrushOutline(newBrushOutline);
      } else {
        setBrushOutline(null);
      }
    } else {
      setBrushOutline(null);
    }
  }

  useEffect(() => {
    if (['erase', 'draw'].includes(activeTool)) {
      setCursorStyle('crosshair');
      updateBrushOutline();
    } else {
      setCursorStyle('default');
      setBrushOutline(null);
    }
  }, [activeTool]);

  useEffect(() => {
    if (Object.keys(layerData).length === 0) return;
    function layerToElement (layer) {
      if (layer == null) return null;
      if (layer.type === 'group') {
        return (
          <Group key={layer._id}>
            {layer.layers.map((layer) => layerToElement(layer)).reverse()}
          </Group>
        );
      } else if (layer.type === 'layer' && layerData[layer._id]) {
        // console.log(layerData[layer._id].canvas.width, layerData[layer._id].canvas.height);
        return (
          <Image
            key={layer._id}
            image={layerData[layer._id].canvas}
            x={layerData[layer._id].position.x}
            y={layerData[layer._id].position.y}
            width={layerData[layer._id].canvas.width}
            height={layerData[layer._id].canvas.height}
            name={layer._id}
            onMouseDown={(e) => handleMouseDownLayer(e, layer)}
          />
        );
      }
    }

    const newLayerElements = layers.map((layer) => layerToElement(layer)).reverse();
    // console.log('newLayerElements', newLayerElements);
    setLayerElements(newLayerElements);
    // console.log('rerendered layer elements');
  }, [layerData, layers, activeTool]);

  function handleMouseDownLayer (e, layer) {
    // console.log('layer', layer);
    if (activeTool === 'select' || activeTool === 'erase' || (
      activeTool === 'draw' && !e.evt.shiftKey &&
      // don't focus on this layer if a new blank layer is being selected
      (!lastSelectedLayer || layerData[lastSelectedLayer._id] !== undefined)
    )) {
      setDragging(true);
      const mousePosition = stageRef.current.getPointerPosition();
      const stagePosition = stageRef.current.position();
      const stageScale = stageRef.current.scaleX();
      const relativeMousePos = {
        x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
        y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
      };
      // console.log(layerData);
      relativeMousePos.x -= layerData[layer._id].position.x;
      relativeMousePos.y -= layerData[layer._id].position.y;
      relativeMousePos.x = Math.floor(relativeMousePos.x / file.tileDimension) * file.tileDimension;
      relativeMousePos.y = Math.floor(relativeMousePos.y / file.tileDimension) * file.tileDimension;
      setDragStartPosition(relativeMousePos);

      if (lastSelectedLayer && layer._id === lastSelectedLayer._id) return;
      // if shift and command and ctrl not pressed then clear all selected layers
      if (!e.evt.shiftKey && !e.evt.ctrlKey && !e.evt.metaKey) {
        dispatch(updateAllLayers({ selected: false }));
        dispatch(setMapEditorPrimitives({ lastSelectedLayer: null }));
      }
      const newLayer = { ...layer, selected: true };
      dispatch(updateLayer({ newLayer }));
      dispatch(updateLayersUpToRoot({ fromLayer: newLayer, newAttributes: { expanded: true } }));
      dispatch(setMapEditorPrimitives(({ lastSelectedLayer: newLayer })));

      setTimeout(() => {
        const layerDiv = document.getElementById(`explorer-${layer._id}`);
        layerDiv.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
      }, 100);
    }
  }

  async function handleKeyDown (e) {
    if (e.key === '1') {
      dispatch(setMapEditorPrimitives({ activeTool: 'draw' }));
    } else if (e.key === '2') {
      dispatch(setMapEditorPrimitives({ activeTool: 'erase' }));
    } else if (e.key === '3') {
      dispatch(setMapEditorPrimitives({ activeTool: 'select' }));
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function handleResize () {
    setCanvasSize({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  }

  return (
    <Stage
      width={canvasSize.width}
      height={canvasSize.height}
      style={{ position: 'absolute', top: 0, left: 56, cursor: cursorStyle }}
      ref={stageRef}
      x={stageData.position.x}
      y={stageData.position.y}
      scale={{ x: stageData.scale, y: stageData.scale }}
      onWheel={handleStageMouseWheel}
      onMouseMove={handleStageMouseMove}
      onMouseDown={handleStageMouseDown}
      onMouseUp={handleStageMouseUp}
      onContextMenu={e => e.evt.preventDefault()}
    >
      <Layer imageSmoothingEnabled={false}>
        {showGrid && <KonvaCheckerboardImage
          width={file.width}
          height={file.height}
          tileDimension={file.tileDimension}
        />}
        {layerElements}
        {hoveredRect}
        {selectedRects}
        {brushOutline}
      </Layer>
    </Stage>
  );
}
