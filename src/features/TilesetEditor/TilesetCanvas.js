/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { Fragment, useEffect, useRef, useState } from 'react';
import { addNewChange, selectLastSelectedLayer, selectTilesetEditorPrimitives, selectTilesetFile, setTilesetEditorPrimitives, updateAllLayers, updateLayer, updateLayersUpToRoot } from './tilesetEditorSlice';
import { Circle, Group, Image, Layer, Rect, Stage } from 'react-konva';
import { reverseColor, trimPng } from '../../utils/canvasUtils';
import { onLayerPosition, emitLayerPosition } from './tilesetEditorSocketApi';

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
  const primitives = useSelector(selectTilesetEditorPrimitives);
  const lastSelectedLayer = useSelector(selectLastSelectedLayer);
  const file = useSelector(selectTilesetFile);
  const { activeTool, brushColor } = primitives;
  const layers = file.rootLayer.layers;
  const dispatch = useDispatch();
  const [stageData, setStageData] = useState({ scale: 5, position: { x: 0, y: 0 } });
  const [layerData, setLayerData] = useState({});
  const [selectedRects, setSelectedRects] = useState([]);
  const [hoveredRect, setHoveredRect] = useState(null);
  const [brushOutline, setBrushOutline] = useState(null);
  const [hoverLayerId, setHoverLayerId] = useState(null);
  const [layerElements, setLayerElements] = useState([]);
  // brush size is width/diameter of brush
  const [brushSize, setBrushSize] = useState(2);
  const [dragging, setDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [mousePosition, setMousePosition] = useState(null);
  const [cursorStyle, setCursorStyle] = useState('default');
  const [brushSizeKeyWasDown, setBrushSizeKeyWasDown] = useState(false);

  const stageRef = useRef(null);

  useEffect(() => {
    onLayerPosition((data) => {
      const { layerId, position } = data;
      // console.log('synchronize layer position', data);
      // console.log(layerData);
      // console.log(layerData[layerId]);
      const newLayerData = { ...layerData };
      newLayerData[layerId].position = position;
      setLayerData(newLayerData);

      // check if layer being moved by another user was hovered over by current user then clear hover
      if (hoverLayerId === layerId) {
        setHoveredRect(null);
      }
    });
  }, [layerData, hoverLayerId]);

  // socketSendUnsavedChanges(() => {
  //   console.log('sending unsaved changes');
  // });

  // useEffect(() => {
  //   if (newChanges.length > 0) {
  //     socketSendUnsavedChanges(() => {
  //       console.log('sending unsaved changes');
  //     });
  //     dispatch(clearNewChanges());
  //   } else {
  //     console.log('no new changes');
  //   }
  // }, [newChanges, file]);

  function colorPixelInCanvas (layerId, stageRef, e) {
    // console.log('color pixel in canvas', layerId);

    let layer = layerData[layerId];
    // get mouse position adjusted for stage position/scale and image position
    const mousePosition = stageRef.current.getPointerPosition();
    const stagePosition = stageRef.current.position();
    const stageScale = stageRef.current.scaleX();
    const relativeMousePos = {
      x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
      y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
    };
    const halfBrushSize = Math.floor(brushSize / 2);
    console.log('halfBrushSize', halfBrushSize);

    // if clicked outside layer, deselect
    // use relativeMousePos and layer.position
    if (layer &&
      (relativeMousePos.x < layer.position.x ||
      relativeMousePos.x > layer.position.x + layer.canvas.width ||
      relativeMousePos.y < layer.position.y ||
      relativeMousePos.y > layer.position.y + layer.canvas.height) &&
      !e.evt.shiftKey
    ) {
      console.log('clicked outside layer');
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: null }));
      return;
    }

    let layerPosition = layer?.position;
    if (!layerPosition) {
      // set layer position to mouse position if it doesn't exist
      layerPosition = {
        x: relativeMousePos.x - halfBrushSize,
        y: relativeMousePos.y - halfBrushSize,
      };
    }

    let layerCanvas = layer?.canvas;
    if (!layerCanvas) {
      // set layer canvas to blank canvas with same size as brush size if it doesn't exist
      layerCanvas = document.createElement('canvas');
      layerCanvas.width = brushSize;
      layerCanvas.height = brushSize;
    }

    const overflows = {
      left: Math.min(0, relativeMousePos.x - layerPosition.x - halfBrushSize),
      right: Math.max(0, relativeMousePos.x - layerPosition.x - layerCanvas.width + halfBrushSize),
      top: Math.min(0, relativeMousePos.y - layerPosition.y - halfBrushSize),
      bottom: Math.max(0, relativeMousePos.y - layerPosition.y - layerCanvas.height + halfBrushSize),
    };
    overflows.left *= -1;
    overflows.top *= -1;

    let brushRect = null;

    // extend layer if shift being pressed using overflows
    if ((overflows.left > 0 || overflows.right > 0 || overflows.top > 0 || overflows.bottom > 0) && e.evt.shiftKey) {
      const newCanvas = document.createElement('canvas');
      const newCtx = newCanvas.getContext('2d');
      const ctx = layerCanvas.getContext('2d');
      const newCanvasWidth = layerCanvas.width + overflows.left + overflows.right;
      const newCanvasHeight = layerCanvas.height + overflows.top + overflows.bottom;
      newCanvas.width = newCanvasWidth;
      newCanvas.height = newCanvasHeight;
      newCtx.drawImage(layerCanvas, overflows.left, overflows.top);

      if (activeTool === 'draw') {
        newCtx.fillStyle = brushColor;
        newCtx.filter = 'url(#remove-alpha)';
        newCtx.globalCompositeOperation = 'source-over';
      } else {
        newCtx.filter = 'url(#remove-alpha)';
        newCtx.globalCompositeOperation = 'destination-out';
      }

      if ((overflows.right > 0 && overflows.top > 0) ||
        (overflows.left > 0 && overflows.bottom > 0)
      ) {
        layerPosition.x -= overflows.left;
        layerPosition.y -= overflows.top;
        // fill rectangle
        if (overflows.left > 0) {
          brushRect = { x: 0, y: newCanvasHeight - brushSize, width: brushSize, height: brushSize };
        } else {
          brushRect = { x: newCanvasWidth - brushSize, y: 0, width: brushSize, height: brushSize };
        }
      } else if (overflows.right > 0 || overflows.bottom > 0) {
        layerPosition = {
          x: layerPosition.x + overflows.left,
          y: layerPosition.y + overflows.top,
        };
        // fill rectangle
        if (overflows.right > 0 && overflows.bottom > 0) {
          brushRect = { x: newCanvasWidth - brushSize, y: newCanvasHeight - brushSize, width: brushSize, height: brushSize };
        } else if (overflows.right > 0) {
          brushRect = { x: newCanvasWidth - brushSize, y: relativeMousePos.y - layerPosition.y - halfBrushSize, width: brushSize, height: brushSize };
        } else if (overflows.bottom > 0) {
          brushRect = { x: relativeMousePos.x - layerPosition.x - halfBrushSize, y: newCanvasHeight - brushSize, width: brushSize, height: brushSize };
        }
      } else {
        layerPosition = {
          x: layerPosition.x - overflows.left,
          y: layerPosition.y - overflows.top,
        };
        // fill rectangle
        if (overflows.left > 0 && overflows.top > 0) {
          brushRect = { x: 0, y: 0, width: brushSize, height: brushSize };
        } else if (overflows.left > 0) {
          brushRect = { x: 0, y: relativeMousePos.y - layerPosition.y - halfBrushSize, width: brushSize, height: brushSize };
        } else if (overflows.top > 0) {
          brushRect = { x: relativeMousePos.x - layerPosition.x - halfBrushSize, y: 0, width: brushSize, height: brushSize };
        } else {
          brushRect = { x: relativeMousePos.x - layerPosition.x, y: relativeMousePos.y - layerPosition.y, width: brushSize, height: brushSize };
        }
      }

      layer.canvas.width = newCanvasWidth;
      layer.canvas.height = newCanvasHeight;
      ctx.filter = 'url(#remove-alpha)';
      ctx.drawImage(newCanvas, 0, 0);
      ctx.fillStyle = brushColor;

      if (activeTool === 'draw') {
        if (brushSize === 1) {
          ctx.fillRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
        } else {
          const circle = new Path2D();
          const params = [brushRect.x + halfBrushSize, brushRect.y + halfBrushSize, halfBrushSize, 0, 2 * Math.PI];
          circle.arc(...params);
          ctx.fill(circle);
        }
      } else {
        ctx.clearRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
      }

      const newLayerData = { ...layerData };
      if (!layer) {
        layer = {
          position: {
            x: relativeMousePos.x - halfBrushSize,
            y: relativeMousePos.y - halfBrushSize,
          },
          canvas: layerCanvas,
        };
      }

      newLayerData[layerId] = {
        ...layer,
        position: layerPosition,
      };
      setLayerData(newLayerData);
      stageRef.current.draw();
    // else color pixel normally
    } else {
      const rectPos = {
        x: relativeMousePos.x - layerPosition.x - halfBrushSize,
        y: relativeMousePos.y - layerPosition.y - halfBrushSize,
      };
      brushRect = { x: rectPos.x, y: rectPos.y, width: brushSize, height: brushSize };

      const ctx = layerCanvas.getContext('2d', { desynchronized: true });
      if (activeTool === 'draw') {
        ctx.fillStyle = brushColor;
        ctx.filter = 'url(#remove-alpha)';
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.filter = 'url(#remove-alpha)';
        ctx.globalCompositeOperation = 'destination-out';
      }

      if (brushSize === 1) {
        ctx.fillRect(brushRect.x, brushRect.y, brushRect.width, brushRect.height);
      } else {
        // color pixels that intersect with circle of radius halfBrushSize at mouse position
        // make sure there is no aliasing at edges of circle using svg filter
        const circle = new Path2D();
        const params = [relativeMousePos.x - layerPosition.x, relativeMousePos.y - layerPosition.y, halfBrushSize, 0, 2 * Math.PI];
        circle.arc(...params);
        ctx.fill(circle);
      }
      // dispatch(addNewChange({ newChange: 'draw' }));
      // emitLayerImage({ layerId, color: 'red', brushSize, brushType: 'circle', params });

      const newLayerData = { ...layerData };
      if (!layer) {
        layer = {
          position: {
            x: relativeMousePos.x - halfBrushSize,
            y: relativeMousePos.y - halfBrushSize,
          },
          canvas: layerCanvas,
        };
      }

      newLayerData[layerId] = layer;
      setLayerData(newLayerData);
      stageRef.current.draw();
    }
  }

  function handleResize () {
    setCanvasSize({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  }

  function handleKeyDown (e) {
    if (e.key === 'Escape') {
      setSelectedRects([]);
    // listen for ] and [ to change brush size
    } else if (e.key === ']' && activeTool !== 'select') {
      const maxBrushSize = 7000;

      // if size is 1, set to 2 (switch from square to circle)
      if (brushSize <= 1) {
        setBrushSize(2);
      // else, increase size/diameter by 2 (increase circle radius by 1)
      } else if (!brushSizeKeyWasDown) {
        setBrushSize(Math.min(brushSize + 2), maxBrushSize);
      } else {
        setBrushSize(Math.min(brushSize * 1.4), maxBrushSize);
      }

      if (!brushSizeKeyWasDown) {
        setBrushSizeKeyWasDown(true);
      }
    // same logic here
    } else if (e.key === '[' && brushSize > 1 && activeTool !== 'select') {
      if (brushSize <= 2) {
        setBrushSize(1);
      } else if (!brushSizeKeyWasDown) {
        setBrushSize(brushSize - 2);
      } else {
        setBrushSize(brushSize * 0.6);
      }

      if (!brushSizeKeyWasDown) {
        setBrushSizeKeyWasDown(true);
      }
    // listen for 1, 2, or 3 to switch between tools
    } else if (e.key === '1') {
      dispatch(setTilesetEditorPrimitives({ activeTool: 'draw' }));
    } else if (e.key === '2') {
      dispatch(setTilesetEditorPrimitives({ activeTool: 'erase' }));
    } else if (e.key === '3') {
      dispatch(setTilesetEditorPrimitives({ activeTool: 'select' }));
    }
  }

  function handleKeyUp (e) {
    if (e.key === ']' || e.key === '[') {
      setBrushSizeKeyWasDown(false);
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [brushSize, brushSizeKeyWasDown, activeTool]);

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const stagePosition = stageData.position;
    const stageScale = stageData.scale;

    if (mousePosition && stagePosition && stageScale && activeTool !== 'select') {
      const flooredRelativeMousePos = {
        x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
        y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
      };

      let strokeWidth = 4 / stageScale;
      const scaledBrushSize = brushSize * stageData.scale;

      if (scaledBrushSize < 13) {
        strokeWidth = 2 / stageScale;
      }

      const newBrushOutline = [];
      const fillColor = activeTool === 'draw' ? brushColor : 'white';
      const outlineColor = activeTool === 'draw' ? reverseColor(fillColor) : 'red';

      // show circle outline if big brush
      if (brushSize > 5) {
        newBrushOutline.push(
          <Circle
            x={flooredRelativeMousePos.x}
            y={flooredRelativeMousePos.y}
            radius={brushSize / 2}
            stroke={outlineColor}
            strokeWidth={strokeWidth}
            dash={[8 / stageScale, 8 / stageScale]}
            dashEnabled={true}
            fill={fillColor}
            opacity={0.5}
            listening={false}
            key={0}
          />,
        );
      // show centered square outline if small brush
      } else if (brushSize > 1) {
        newBrushOutline.push(
          <Rect
            x={flooredRelativeMousePos.x - brushSize / 2}
            y={flooredRelativeMousePos.y - brushSize / 2}
            width={brushSize}
            height={brushSize}
            stroke={outlineColor}
            strokeWidth={strokeWidth}
            dash={[8 / stageScale, 8 / stageScale]}
            dashEnabled={true}
            fill={fillColor}
            opacity={0.5}
            listening={false}
            key={0}
          />,
        );
      // show uncentered square outline if 1 pixel brush
      } else {
        newBrushOutline.push(
          <Rect
            x={flooredRelativeMousePos.x}
            y={flooredRelativeMousePos.y}
            width={brushSize}
            height={brushSize}
            stroke={outlineColor}
            strokeWidth={strokeWidth}
            dash={[8 / stageScale, 8 / stageScale]}
            dashEnabled={true}
            fill={fillColor}
            opacity={0.5}
            listening={false}
            key={0}
          />,
        );
      }
      setBrushOutline(newBrushOutline);
    } else {
      setBrushOutline(null);
    }
  }, [brushSize, brushColor, mousePosition, stageData]);

  useEffect(() => {
    const layerIdToImageUrl = {};
    function traverse (layer) {
      if (layer.type === 'layer') {
        layerIdToImageUrl[layer._id] = layer.tilesetLayerUrl;
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
      if (!virtualCanvases) return;
      const newLayerData = {};
      Object.keys(layerIdToImageUrl).forEach((layerId) => {
        if (document.getElementById(layerId)) return;
        const trimmedImageData = trimPng(layerIdToImageUrl[layerId]);
        const canvas = document.createElement('canvas');
        canvas.id = `canvas-${layerId}`;
        canvas.width = trimmedImageData.width;
        canvas.height = trimmedImageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(trimmedImageData, 0, 0);
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

    // add event listeners
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function handleMouseDownLayer (e, layer) {
    if (activeTool === 'select' || activeTool === 'erase' || (
      activeTool === 'draw' && !e.evt.shiftKey
    )) {
      setDragging(true);
      const mousePosition = stageRef.current.getPointerPosition();
      const stagePosition = stageRef.current.position();
      const stageScale = stageRef.current.scaleX();
      const relativeMousePos = {
        x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
        y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
      };
      relativeMousePos.x -= layerData[layer._id].position.x;
      relativeMousePos.y -= layerData[layer._id].position.y;
      setDragStartPosition(relativeMousePos);

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
      // check if is layer and also is not new blank layer (no layerData set for it yet) before trying to render
      } else if (layer.type === 'layer' && layerData[layer._id]) {
        return (
          <Image
            key={layer._id}
            image={layerData[layer._id].canvas}
            x={layerData[layer._id].position.x}
            y={layerData[layer._id].position.y}
            visible={layer.visible}
            name={layer._id}
            onMouseDown={(e) => handleMouseDownLayer(e, layer)}
          />
        );
      }
    }

    const newLayerElements = layers.map((layer) => layerToElement(layer)).reverse();
    setLayerElements(newLayerElements);
    // console.log('rerendered');
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
  };

  const handleStageMouseDown = (e) => {
    if (e.target.attrs.name === undefined && activeTool === 'select') {
      // clear selection if click on stage
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: null }));
    } else if (lastSelectedLayer) {
      if ((activeTool === 'draw' || activeTool === 'erase')) {
        colorPixelInCanvas(lastSelectedLayer._id, stageRef, e);
      }
    }
  };

  const handleStageMouseMove = (e) => {
    // update mouse position
    setMousePosition(stageRef.current.getPointerPosition());

    const hoverLayerId = e.target.attrs.name;
    if (e.target.image !== undefined && activeTool === 'select' && !dragging) {
      const hoveredLayer = layerData[hoverLayerId];
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
      const layer = layerData[layerId];

      if (dragging) {
        // center the layer on the mouse
        const newImagePosition = {
          x: relativeMousePos.x - dragStartPosition.x,
          y: relativeMousePos.y - dragStartPosition.y,
        };

        // if new position is same as old position then don't update
        if (window.lastPosition && window.lastPosition.x === newImagePosition.x && window.lastPosition.y === newImagePosition.y) {
          return;
        }

        window.lastPosition = newImagePosition;
        const newLayer = {
          ...layer,
          position: newImagePosition,
        };
        const newLayerData = { ...layerData };
        newLayerData[layerId] = newLayer;
        setLayerData(newLayerData);

        dispatch(addNewChange({ newChange: 'moveLayer' }));
        emitLayerPosition({ layerId, position: newImagePosition });
      }
    }
  };

  const handleStageMouseUp = () => {
    if (activeTool === 'select') {
      setDragging(false);
      setDragStartPosition(null);
    }
  };

  const handleStageMouseLeave = () => {
    setDragging(false);
    setDragStartPosition(null);
    setHoveredRect(null);
    setHoverLayerId(null);
    setBrushOutline(null);
  };

  useEffect(() => {
    if (activeTool === 'select') {
      setCursorStyle('default');
    } else if (activeTool === 'draw' || activeTool === 'erase') {
      setCursorStyle('crosshair');
    }
  }, [stageData.scale, activeTool, brushSize]);

  // check state of newChanges every n seconds
  // const [triggerCheck, setTriggerCheck] = useState(false);
  // useEffect(() => {
  //   const interval = window.setInterval(() => {
  //     setTriggerCheck(!triggerCheck);
  //   }, 2000);
  //   return () => window.clearInterval(interval);
  // }, [triggerCheck]);

  // useEffect(() => {
  //   if (newChanges.length > 0) {
  //     // dispatch(asyncPatchFile({ id, file }));
  //     console.log('new changes saved');
  //   } else {
  //     console.log('no new changes');
  //   }
  //   dispatch(clearNewChanges());
  // }, [triggerCheck]);

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
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseLeave}
        style={{ position: 'absolute', top: 0, left: 56, cursor: cursorStyle }}
      >
        <Layer imageSmoothingEnabled={false}>
          {layerElements}
          {hoveredRect}
          {selectedRects}
          {brushOutline}
        </Layer>
      </Stage>
    </Fragment>
  );
}
