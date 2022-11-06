/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { Fragment, useEffect, useRef, useState } from 'react';
import { selectLastSelectedLayer, selectPrimitives, setTilesetEditorPrimitives, updateAllLayers, updateLayer, updateLayersUpToRoot } from './tilesetEditorSlice';
import { Group, Image, Layer, Rect, Stage } from 'react-konva';
import { trimPng } from '../../utils/canvasUtils';

const virtualCanvasesStyle = css`
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100px;
  background: #efefef;
  overflow-y: scroll;
  transform-origin: top right;
  image-rendering: pixelated;
  gap: 24px;
  z-index: 100;
`;

export function getLayerFromId (layers, id) {
  function traverse (layers) {
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer._id === id) {
        return layer;
      }
      if (layer.layers) {
        const result = traverse(layer.layers);
        if (result) {
          return result;
        }
      }
    }
  }
  return traverse(layers);
}

export function TilesetCanvas () {
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  const tilesetEditorSlice = useSelector((state) => state.tilesetEditor);
  const primitives = useSelector(selectPrimitives);
  const lastSelectedLayer = useSelector(selectLastSelectedLayer);
  const activeTool = primitives.activeTool;
  const file = tilesetEditorSlice.file;
  const layers = file.rootLayer.layers;
  const dispatch = useDispatch();
  const [stageData, setStageData] = useState({ scale: 5, position: { x: 0, y: 0 } });
  const [layerData, setLayerData] = useState({});
  const [selectedRects, setSelectedRects] = useState([]);
  const [hoveredRect, setHoveredRect] = useState(null);
  const [layerElements, setLayerElements] = useState([]);
  const [brushColor, setBrushColor] = useState('red');
  const [brushSize, setBrushSize] = useState(10);
  const stageRef = useRef(null);

  function colorPixelInCanvas (layerId, stageRef) {
    const layer = layerData[layerId];
    // get mouse position adjusted for stage position/scale and image position
    const mousePosition = stageRef.current.getPointerPosition();
    const stagePosition = stageRef.current.position();
    const stageScale = stageRef.current.scaleX();
    const relativeMousePos = {
      x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
      y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
    };
    const ctx = layer.canvas.getContext('2d');
    const halfBrushSize = Math.floor(brushSize / 2);
    const overflows = {
      left: Math.min(0, relativeMousePos.x - layer.position.x - halfBrushSize),
      right: Math.max(0, relativeMousePos.x - layer.position.x - layer.canvas.width + halfBrushSize),
      top: Math.min(0, relativeMousePos.y - layer.position.y - halfBrushSize),
      bottom: Math.max(0, relativeMousePos.y - layer.position.y - layer.canvas.height + halfBrushSize),
    };
    overflows.left *= -1;
    overflows.top *= -1;
    console.log(overflows);

    let brushRect = null;
    if (overflows.left > 0 || overflows.right > 0 || overflows.top > 0 || overflows.bottom > 0) {
      console.log('overflow');
      return;
    } else {
      const rectPos = {
        x: relativeMousePos.x - layer.position.x - halfBrushSize,
        y: relativeMousePos.y - layer.position.y - halfBrushSize,
      };
      brushRect = { x: rectPos.x, y: rectPos.y, width: brushSize, height: brushSize };
    }

    if (activeTool === 'draw') {
      ctx.fillStyle = 'red';
      ctx.fillRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
    } else {
      ctx.clearRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
    }

    const newLayerData = { ...layerData };
    newLayerData[layerId] = layer;
    setLayerData(newLayerData);
    stageRef.current.draw();
  }

  useEffect(() => {
    const layerIdToImageUrl = {};
    function traverse (layer) {
      if (layer.type === 'layer') {
        layerIdToImageUrl[layer._id] = layer.imageUrl;
      }
      layer.layers.forEach(traverse);
    }
    traverse(file.rootLayer);

    async function loadImages () {
      await Promise.all(Object.keys(layerIdToImageUrl).map(async (layerId) => {
        const imageUrl = layerIdToImageUrl[layerId];
        const image = new window.Image();
        image.src = imageUrl;
        await image.decode();
        layerIdToImageUrl[layerId] = image;
      }));

      const virtualCanvases = document.getElementById('virtual-canvases');
      const newLayerData = {};
      Object.keys(layerIdToImageUrl).forEach((layerId) => {
        if (document.getElementById(layerId)) return;
        const canvas = trimPng(layerIdToImageUrl[layerId]);
        canvas.id = `canvas-${layerId}`;
        virtualCanvases.appendChild(canvas);
        newLayerData[layerId] = {};
        newLayerData[layerId].canvas = canvas;
      });

      if (Object.keys(newLayerData).length > 0) {
        // get layer positions and set them in newLayerData
        function traverse (layer) {
          if (layer.type === 'layer') {
            newLayerData[layer._id].position = layer.position;
          }
          layer.layers.forEach(traverse);
        }
        traverse(file.rootLayer);

        setLayerData(newLayerData);
      }
    }

    loadImages();
  }, []);

  function handleMouseDownLayer (e, layer) {
    if (activeTool === 'select') {
      if (lastSelectedLayer && layer._id === lastSelectedLayer._id) return;
      // if shift and command and ctrl not pressed then clear all selected layers
      if (!e.evt.shiftKey && !e.evt.ctrlKey && !e.evt.metaKey) {
        dispatch(updateAllLayers({ selected: false }));
        dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: null }));
      }
      const newLayer = { ...layer, selected: true };
      dispatch(updateLayer({ newLayer }));
      dispatch(updateLayersUpToRoot({ fromLayer: newLayer, newAttributes: { expanded: true } }));
      dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: newLayer }));

      setTimeout(() => {
        const layerDiv = document.getElementById(`explorer-${layer._id}`);
        layerDiv.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
      }, 100);
    }
  }

  useEffect(() => {
    if (Object.keys(layerData).length === 0) return;
    function layerToElement (layer) {
      if (layer == null) return null;
      if (layer.type === 'group') {
        return (
          <Group
            key={layer._id}
          >
            {layer.layers.map((layer) => layerToElement(layer)).reverse()}
          </Group>
        );
      } else if (layer.type === 'layer') {
        return (
          <Image
            key={layer._id}
            image={layerData[layer._id].canvas}
            x={layer.position.x}
            y={layer.position.y}
            name={layer._id}
            onMouseDown={(e) => handleMouseDownLayer(e, layer)}
          />
        );
      }
    }

    const newLayerElements = layers.map((layer) => layerToElement(layer)).reverse();
    setLayerElements(newLayerElements);
    console.log('rendered');
  }, [layerData, layers, activeTool]);

  useEffect(() => {
    // if switching to draw tool then deselect all layers except the last selected layer
    if (activeTool === 'draw') {
      if (lastSelectedLayer) {
        dispatch(updateAllLayers({ selected: false }));
        if (lastSelectedLayer.type === 'layer') {
          dispatch(updateLayer({ newLayer: lastSelectedLayer }));
        }
      }
    }
  }, [activeTool, lastSelectedLayer]);

  useEffect(() => {
    const newSelectedRects = [];
    function traverse (layer) {
      if (layer.type === 'layer' && layer.selected) {
        newSelectedRects.push(
          <Rect
            x={layer.position.x}
            y={layer.position.y}
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
    traverse(file.rootLayer);
    setSelectedRects(newSelectedRects);
  }, [layers, layerData, stageData.scale]);

  const handleStageMouseWheel = (e) => {
    e.evt.preventDefault();
    setHoveredRect(null);
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
      const cursorPosition = stageRef.current.getPointerPosition();
      const stagePosition = stageRef.current.position();
      const stageScale = stageRef.current.scaleX();
      const cursorPos = {
        x: (cursorPosition.x - stagePosition.x) / stageScale,
        y: (cursorPosition.y - stagePosition.y) / stageScale,
      };
      const newScale = stageData.scale - e.evt.deltaY / 400 * stageData.scale;
      if (newScale < 0.1 || newScale > 1000) return;
      setStageData({
        ...stageData,
        scale: newScale,
        position: {
          x: cursorPosition.x - cursorPos.x * newScale,
          y: cursorPosition.y - cursorPos.y * newScale,
        },
      });
    }
  };

  const handleStageMouseDown = (e) => {
    if (e.target.attrs.name === undefined && activeTool === 'select') {
      // clear selection if click on stage
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: null }));
    } else if (lastSelectedLayer) {
      if ((activeTool === 'draw' || activeTool === 'erase')) {
        colorPixelInCanvas(lastSelectedLayer._id, stageRef, 'red');
      }
    }
  };

  const handleStageMouseMove = (e) => {
    if (e.target.image !== undefined && activeTool === 'select') {
      const hoveredLayer = layerData[e.target.attrs.name];
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
        />,
      );
    } else {
      setHoveredRect(null);
    }
  };

  function getCursorStyle () {
    if (activeTool === 'select') return 'default';
    if (activeTool === 'draw') return 'crosshair';
    if (activeTool === 'erase') return 'crosshair';
  }

  return (
    <Fragment>
      <div id={'virtual-canvases'} css={virtualCanvasesStyle} />
      <Stage
        width={canvasSize.width}
        height={canvasSize.height}
        x={stageData.position.x}
        y={stageData.position.y}
        scale={{ x: stageData.scale, y: stageData.scale }}
        ref={stageRef}
        onWheel={handleStageMouseWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        // onMouseUp={handleStageMouseUp}
        style={{ position: 'absolute', top: 0, left: 56, cursor: getCursorStyle() }}
      >
        <Layer imageSmoothingEnabled={false}>
          {layerElements}
          {hoveredRect}
          {selectedRects}
        </Layer>
      </Stage>
    </Fragment>
  );
}
