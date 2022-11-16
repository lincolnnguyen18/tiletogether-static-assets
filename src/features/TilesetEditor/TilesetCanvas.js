/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { Fragment, useEffect, useRef, useState } from 'react';
import { addNewChanges, addNewTilesetLayer, asyncSaveChanges, clearChanges, deleteLayerById, selectLastSelectedLayer, selectTilesetEditorPrimitives, selectTilesetFile, selectTilesetNewChanges, setTilesetEditorPrimitives, updateAllLayers, updateLayer, updateLayersUpToRoot } from './tilesetEditorSlice';
import { Circle, Group, Image, Layer, Rect, Stage } from 'react-konva';
import { initializeAElement, initializeFreqReadCanvas, isCompletelyTransparent, rgbToHex, trimPng } from '../../utils/canvasUtils';
import { onLayerPosition, emitLayerPosition, onChangesSaved } from './tilesetEditorSocketApi';
import { selectTilesetRightSidebarPrimitives, setTilesetRightSidebarPrimitives } from './rightSidebarSlice';
import { selectLeftSidebarPrimitives, setLeftSidebarPrimitives } from '../Editor/leftSidebarSlice';
import { usePrevious } from '../../utils/stateUtils';

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

export function KonvaCheckerboardImage ({ width, height, tileDimension }) {
  if (window.checkerboardCanvas == null || window.checkerboardCanvas.width !== width * tileDimension || window.checkerboardCanvas.height !== height * tileDimension) {
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
    window.checkerboardCanvas = canvas;
    // console.log('rerendered checkerboard');
  }
  return <Image image={window.checkerboardCanvas} />;
}

export function downloadFileAsCanvas ({ file, layerData }) {
  if (!layerData) return;

  initializeFreqReadCanvas();
  const canvas = window.freqReadCanvas;
  const ctx = window.freqReadCtx;
  canvas.width = file.width * file.tileDimension;
  canvas.height = file.height * file.tileDimension;

  function traverse (layer) {
    if (layer.type === 'layer') {
      const { canvas, position } = layerData[layer._id];
      if (canvas) {
        const opacity = layer.opacity;
        // reverse drawing z-index with globalCompositeOperation
        ctx.globalCompositeOperation = 'destination-over';
        ctx.globalAlpha = opacity;
        ctx.drawImage(canvas, position.x, position.y);
      }
    }
    if (layer.layers) {
      layer.layers.forEach(traverse);
    }
  }
  traverse(file.rootLayer);
  ctx.globalCompositeOperation = 'source-over';
  return canvas;
}

export function TilesetCanvas () {
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  const primitives = useSelector(selectTilesetEditorPrimitives);
  const rightSidebarPrimitives = useSelector(selectTilesetRightSidebarPrimitives);
  const leftSidebarPrimitives = useSelector(selectLeftSidebarPrimitives);
  const { showGrid } = leftSidebarPrimitives;
  const lastSelectedLayer = useSelector(selectLastSelectedLayer);
  const file = useSelector(selectTilesetFile);
  const { activeTool, downloadFormat, reuploadingFileImage } = primitives;
  const { brushColor } = rightSidebarPrimitives;
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
  const [points, setPoints] = useState([]);
  const newChanges = useSelector(selectTilesetNewChanges);
  const stageRef = useRef(null);
  const [pastingImage, setPastingImage] = useState(null);

  async function handlePaste (e) {
    e.preventDefault();
    // console.log('paste');
    // check if it's a png
    if (e.clipboardData.items[0].type === 'image/png') {
      const mousePosition = stageRef.current.getPointerPosition();
      const stagePosition = stageRef.current.position();
      const stageScale = stageRef.current.scaleX();
      const relativeMousePos = {
        x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
        y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
      };

      const blob = e.clipboardData.items[0].getAsFile();
      const url = URL.createObjectURL(blob);
      const img = new window.Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // const w = window.open();
      // // open canvas in new tab
      // w.document.body.appendChild(canvas);
      // w.document.close();
      dispatch(addNewTilesetLayer());
      setPastingImage({ canvas, relativeMousePos });
    }
  }

  useEffect(() => {
    if (pastingImage != null) {
      const { canvas, relativeMousePos } = pastingImage;
      layerData[lastSelectedLayer._id] = { canvas, position: relativeMousePos };
      setLayerData({ ...layerData });
      dispatch(addNewChanges({ layerId: lastSelectedLayer._id, newChanges: ['canvas'] }));
      setPastingImage(null);
    }
  }, [pastingImage]);

  useEffect(() => {
    if (!downloadFormat || !file.rootLayer) return;
    // console.log('downloadFormat', downloadFormat);

    // download canvas as png
    initializeAElement();
    const canvas = downloadFileAsCanvas({ file, layerData });
    const a = window.aElement;
    a.href = canvas.toDataURL('image/png');
    a.download = `${file.name}.${downloadFormat}`;
    a.click();

    // // open canvas in new tab
    // const w = window.open();
    // w.document.body.appendChild(canvas);
    // w.document.close();

    dispatch(setTilesetEditorPrimitives({ downloadFormat: null }));
    dispatch(setLeftSidebarPrimitives({ drawerOpen: false }));
  }, [downloadFormat]);

  useEffect(() => {
    if (reuploadingFileImage) {
      // console.log('reuploadingFileImage', reuploadingFileImage);
      dispatch(addNewChanges({ layerId: 'all', newChanges: ['canvas'] }));
      dispatch(asyncSaveChanges({ layerData, newChanges, file }));
      dispatch(setTilesetEditorPrimitives({ reuploadingFileImage: false }));
    }
  }, [reuploadingFileImage]);

  useEffect(() => {
    onChangesSaved(() => {
      console.log('changes saved');
      dispatch(clearChanges());
      dispatch(setTilesetEditorPrimitives({ savingChanges: false }));
    });
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
      dispatch(setTilesetEditorPrimitives({ savingChanges: false, reuploadingFileImage: false }));
    };
  }, []);

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

  function deletePrevLastSelectedLayerIfEmpty () {
    // check if last selected layer's canvas is completely transparent
    if (!prevLastSelectedLayer) return;
    // console.log(prevLastSelectedLayer);
    const layer = layerData[prevLastSelectedLayer._id];
    // console.log(layer);
    if (!layer || !layer.canvas || isCompletelyTransparent(layer.canvas)) {
      if (prevLastSelectedLayer.type !== 'layer') return;
      // console.log('canvas is completely transparent or uninitialized');
      dispatch(deleteLayerById({ id: prevLastSelectedLayer._id }));
    }
  }

  const prevLastSelectedLayer = usePrevious(lastSelectedLayer);

  useEffect(() => {
    // console.log('last selected layer', _.cloneDeep(lastSelectedLayer));
    // console.log('prev last selected layer', _.cloneDeep(prevLastSelectedLayer));

    if (lastSelectedLayer == null && prevLastSelectedLayer != null) {
      deletePrevLastSelectedLayerIfEmpty();
    }
  }, [lastSelectedLayer]);

  function colorPixelInCanvas (layerId, stageRef, e) {
    // console.log('color pixel in canvas', layerId);

    if (brushSize < 1) {
      setBrushSize(1);
    }

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
    // logging halfBrushSize because a rare bug sometimes occurs where the brush size is 1 but nothing is being drawn or the brush outline is slightly larger than the actual brush size; trying to reproduce it and track down the cause; update: should be fixed now, when brush size was increased/decreased by a factor, forgot to floor so was not whole number sometimes
    // update; nvm, bug still happening sometimes, no idea why, will remove this when this is resolved
    // console.log('halfBrushSize', halfBrushSize);

    if (halfBrushSize < 0) {
      return;
    }

    // if clicked outside layer, deselect
    // use relativeMousePos and layer.position
    if (layer &&
      (relativeMousePos.x < layer.position.x ||
      relativeMousePos.x > layer.position.x + layer.canvas.width ||
      relativeMousePos.y < layer.position.y ||
      relativeMousePos.y > layer.position.y + layer.canvas.height) &&
      !e.evt.shiftKey && !dragging
    ) {
      // console.log('clicked outside layer');
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: null }));
      return;
    }

    let layerPosition = layer ? { x: layer.position.x, y: layer.position.y } : null;
    // console.log(layerPosition);
    if (!layerPosition) {
      // set layer position to mouse position if it doesn't exist
      layerPosition = {
        x: relativeMousePos.x - halfBrushSize,
        y: relativeMousePos.y - halfBrushSize,
      };
    }

    let layerCanvas = layer ? layer.canvas : null;
    if (!layerCanvas) {
      // set layer canvas to blank canvas with same size as brush size if it doesn't exist
      layerCanvas = document.createElement('canvas');
      layerCanvas.width = brushSize;
      layerCanvas.height = brushSize;
    }
    // console.log(layerCanvas);

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
    if ((overflows.left > 0 || overflows.right > 0 || overflows.top > 0 || overflows.bottom > 0) && e.evt.shiftKey && activeTool === 'draw') {
      const newCanvas = document.createElement('canvas');
      const newCtx = newCanvas.getContext('2d');
      const ctx = layerCanvas.getContext('2d');
      let newCanvasWidth = layerCanvas.width + overflows.left + overflows.right;
      let newCanvasHeight = layerCanvas.height + overflows.top + overflows.bottom;

      if (overflows.right > 0 && brushSize === 1) {
        newCanvasWidth += 1;
      }
      if (overflows.bottom > 0 && brushSize === 1) {
        newCanvasHeight += 1;
      }

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
      // console.log('newCanvasWidth', newCanvasWidth);
      // console.log('newCanvasHeight', newCanvasHeight);
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

      setPoints([]);

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
      // console.log(_.cloneDeep(newLayerData));
      setLayerData(newLayerData);
      stageRef.current.draw();
      dispatch(addNewChanges({ layerId, newChanges: ['canvas', 'position'] }));
    // else color pixel normally
    } else {
      const rectPos = {
        x: relativeMousePos.x - layerPosition.x - halfBrushSize,
        y: relativeMousePos.y - layerPosition.y - halfBrushSize,
      };
      brushRect = { x: rectPos.x, y: rectPos.y, width: brushSize, height: brushSize };
      setPoints([...points, { x: relativeMousePos.x - layerPosition.x, y: relativeMousePos.y - layerPosition.y }]);

      const ctx = layerCanvas.getContext('2d', { desynchronized: true });
      ctx.filter = 'url(#remove-alpha)';
      if (activeTool === 'draw') {
        ctx.fillStyle = brushColor;
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalCompositeOperation = 'destination-out';
      }

      if (points.length <= 1) {
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
      }

      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // draw path of all points in points array
      ctx.beginPath();
      points.forEach((point) => {
        // canvas calculates from half of a pixel so need to offset by half of a pixel if brush size is 1
        if (brushSize === 1) {
          ctx.lineTo(point.x + 0.5, point.y + 0.5);
        } else {
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      });

      // keep only 7 points in array to reduce lag; if there are more than 7 points, remove the first points until there are 7
      if (points.length > 7) {
        setPoints(points.slice(points.length - 7));
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

      newLayerData[layerId] = layer;
      setLayerData(newLayerData);
      dispatch(addNewChanges({ layerId, newChanges: ['canvas', 'position'] }));
    }
  }

  function handleResize () {
    setCanvasSize({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  }

  async function handleKeyDown (e) {
    if (e.key === 'Escape') {
      setSelectedRects([]);
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: null }));
    // listen for ] and [ to change brush size
    } else if (e.key === ']' && ['erase', 'draw'].includes(activeTool)) {
      const maxBrushSize = 7000;

      // if size is 1, set to 2 (switch from square to circle)
      if (brushSize <= 1) {
        setBrushSize(2);
      // else, increase size/diameter by 2 (increase circle radius by 1)
      } else if (!brushSizeKeyWasDown) {
        setBrushSize(Math.min(Math.floor(brushSize + 2)), maxBrushSize);
      } else {
        setBrushSize(Math.min(Math.floor(brushSize * 1.4)), maxBrushSize);
      }

      if (!brushSizeKeyWasDown) {
        setBrushSizeKeyWasDown(true);
      }
    // same logic here
    } else if (e.key === '[' && brushSize > 1 && ['erase', 'draw'].includes(activeTool)) {
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
    } else if (e.key === '4') {
      dispatch(setTilesetEditorPrimitives({ activeTool: 'color-picker' }));
    // listen for ctrl or command + s to save
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // console.log('saving');
      if (primitives.savingChanges) {
        console.log('already saving');
        return;
      }
      if (Object.keys(newChanges).length === 0) {
        console.log('no changes to save');
        return;
      }
      console.log(newChanges);
      await dispatch(asyncSaveChanges({ layerData, newChanges, file }));
      dispatch(setTilesetEditorPrimitives({ savingChanges: true }));
    // listen for shift + t; 'T', to trim selected layer
    } else if (e.key === 'T') {
      e.preventDefault();
      if (!lastSelectedLayer) return;
      const inputCanvas = layerData[lastSelectedLayer._id].canvas;
      if (!inputCanvas) return;
      console.log('trimming', inputCanvas.width, inputCanvas.height);
      const { trimmedImageData, overflows } = trimPng(inputCanvas);
      // console.log('trimmed', trimmedImageData.width, trimmedImageData.height);
      const canvas = document.createElement('canvas');
      canvas.width = trimmedImageData.width;
      canvas.height = trimmedImageData.height;
      console.log('trimmedImageData', trimmedImageData.width, trimmedImageData.height);
      const ctx = canvas.getContext('2d');
      ctx.putImageData(trimmedImageData, 0, 0);
      const newLayerData = { ...layerData };
      // console.log(_.cloneDeep(newLayerData[lastSelectedLayer._id]));
      newLayerData[lastSelectedLayer._id] = {
        ...newLayerData[lastSelectedLayer._id],
        canvas,
        position: {
          x: newLayerData[lastSelectedLayer._id].position.x + overflows.left,
          y: newLayerData[lastSelectedLayer._id].position.y + overflows.top,
        },
      };
      setLayerData(newLayerData);
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
  }, [brushSize, brushSizeKeyWasDown, activeTool, layerData, file, newChanges, primitives.savingChanges, lastSelectedLayer]);

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const stagePosition = stageData.position;
    const stageScale = stageData.scale;

    if (mousePosition && stagePosition && stageScale && ['draw', 'erase'].includes(activeTool)) {
      const flooredRelativeMousePos = {
        x: Math.floor((mousePosition.x - stagePosition.x) / stageScale),
        y: Math.floor((mousePosition.y - stagePosition.y) / stageScale),
      };

      if (activeTool === 'color-picker') {
        setBrushSize(1);
      }

      let strokeWidth = 2 / stageScale;
      const scaledBrushSize = brushSize * stageData.scale;

      if (scaledBrushSize < 13) {
        strokeWidth = 2 / stageScale;
      }

      const newBrushOutline = [];
      const outerRingColor = 'black';
      const innerRingColor = 'white';

      // show circle outline if big brush; make its color the inverse of layers behind it using globalCompositeOperation
      if (brushSize > 4) {
        newBrushOutline.push(
          <Circle
            x={flooredRelativeMousePos.x}
            y={flooredRelativeMousePos.y}
            radius={brushSize / 2}
            stroke={outerRingColor}
            strokeWidth={strokeWidth}
            listening={false}
            key={0}
          />,
        );
        newBrushOutline.push(
          <Circle
            x={flooredRelativeMousePos.x}
            y={flooredRelativeMousePos.y}
            radius={(brushSize / 2) - 1 / stageScale}
            stroke={innerRingColor}
            strokeWidth={strokeWidth}
            listening={false}
            key={1}
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
            stroke={outerRingColor}
            strokeWidth={strokeWidth}
            listening={false}
            key={0}
          />,
        );
        newBrushOutline.push(
          <Rect
            x={flooredRelativeMousePos.x - brushSize / 2 + 1 / stageScale}
            y={flooredRelativeMousePos.y - brushSize / 2 + 1 / stageScale}
            width={brushSize - 2 / stageScale}
            height={brushSize - 2 / stageScale}
            stroke={innerRingColor}
            strokeWidth={strokeWidth}
            listening={false}
            key={1}
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
            stroke={outerRingColor}
            strokeWidth={strokeWidth}
            listening={false}
            key={0}
          />,
        );
        newBrushOutline.push(
          <Rect
            x={flooredRelativeMousePos.x + 1 / stageScale}
            y={flooredRelativeMousePos.y + 1 / stageScale}
            width={brushSize - 2 / stageScale}
            height={brushSize - 2 / stageScale}
            stroke={innerRingColor}
            strokeWidth={strokeWidth}
            listening={false}
            key={1}
          />,
        );
      }
      setBrushOutline(newBrushOutline);
    } else {
      setBrushOutline(null);
    }
  }, [brushSize, brushColor, mousePosition, stageData, activeTool]);

  // Clear brush outline when changing color in color picker (otherwise a ghost of it shows up on canvas edge)
  useEffect(() => {
    setBrushOutline(null);
  }, [brushColor]);

  useEffect(() => {
    const layerIdToImageUrl = {};
    function traverse (layer) {
      if (layer.type === 'layer') {
        layerIdToImageUrl[layer._id] = layer.tilesetLayerUrl;
      }
      layer.layers.forEach(traverse);
    }
    traverse(file.rootLayer);

    // console.log(file);
    // console.log('layerIdToImageUrl', layerIdToImageUrl);

    // if any values of layerIdToImageUrl are undefined, wait for them to be defined
    if (Object.values(layerIdToImageUrl).some((value) => value === undefined)) {
      return;
    }

    async function loadImages () {
      await Promise.all(Object.keys(layerIdToImageUrl).map(async (layerId) => {
        const imageUrl = layerIdToImageUrl[layerId];
        const image = new window.Image();
        image.crossOrigin = 'Anonymous';
        image.src = imageUrl;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        layerIdToImageUrl[layerId] = ctx.getImageData(0, 0, image.width, image.height);
      }));

      // console.log(layerIdToImageUrl);

      // not using virtualCanvases for now
      // const virtualCanvases = document.getElementById('virtual-canvases');
      // if (!virtualCanvases) return;
      const newLayerData = {};
      Object.keys(layerIdToImageUrl).forEach((layerId) => {
        if (document.getElementById(layerId)) return;
        const image = layerIdToImageUrl[layerId];
        const canvas = document.createElement('canvas');
        canvas.id = `canvas-${layerId}`;
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(image, 0, 0);
        // virtualCanvases.appendChild(canvas);
        newLayerData[layerId] = {};
        newLayerData[layerId].canvas = canvas;
      });

      if (Object.keys(newLayerData).length > 0) {
        // get layer positions and set them in newLayerData
        function traverse (layer) {
          if (layer.type === 'layer') {
            newLayerData[layer._id].position = layer.position;
            // console.log('position', layer.position);
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
    if (activeTool === 'color-picker') {
      return;
    }
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
          <Group key={layer._id}>
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
            opacity={layer.opacity}
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
  }, [activeTool, layerData, layers]);

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

    // remove hover rect if hoverLayerId not in newSelectedRects (to prevent ghost hover rect after deleting a layer)
    if (hoverLayerId && !newSelectedRects.find((rect) => rect.key === hoverLayerId)) {
      setHoveredRect(null);
      setHoverLayerId(null);
    }
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
    if (activeTool === 'color-picker') {
      const hex = getPixelFromStage(stageRef);
      dispatch(setTilesetRightSidebarPrimitives({ brushColor: hex }));
      dispatch(setTilesetEditorPrimitives({ activeTool: 'draw' }));
    } else if (e.target.attrs.name === undefined && activeTool === 'select') {
      // clear selection if click on stage
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: null }));
    } else if (lastSelectedLayer) {
      if ((activeTool === 'draw' || activeTool === 'erase')) {
        colorPixelInCanvas(lastSelectedLayer._id, stageRef, e);
      }
    }
  };

  function getPixelFromStage (stageRef) {
    // get all layers intersecting with pointer; use getAllIntersections
    const intersectingLayers = stageRef.current.getAllIntersections(stageRef.current.getPointerPosition());
    // console.log(intersectingLayers);

    function getPixelAtPoint (layer, point) {
      // console.log(layer);
      // convert layer to canvas and open in new window
      const canvas = layer.attrs.image;
      // console.log(layer.attrs.name);

      // get pixel from layer
      const pixel = canvas.getContext('2d').getImageData(point.x, point.y, 1, 1).data;
      // convert pixel to hex
      return rgbToHex(pixel[0], pixel[1], pixel[2]);
    }

    // get pixels from first to last layer in intersectingLayers until a non-transparent pixel is found
    for (let i = intersectingLayers.length - 1; i >= 0; i--) {
      const layer = intersectingLayers[i];
      const point = layer.getRelativePointerPosition();
      const hex = getPixelAtPoint(layer, point);
      if (hex !== '#000000') {
        return hex;
      }
    }
  }

  const handleStageMouseMove = (e) => {
    if (activeTool === 'color-picker') {
      // update color being hovered over in real time
      const hex = getPixelFromStage(stageRef);
      dispatch(setTilesetRightSidebarPrimitives({ brushColor: hex }));
      return;
    }

    // update mouse position
    setMousePosition(stageRef.current.getPointerPosition());

    const hoverLayerId = e.target.attrs.name;
    if (e.target.image !== undefined && activeTool === 'select' && !dragging) {
      const hoveredLayer = layerData[hoverLayerId];
      if (!hoveredLayer) return;
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

        dispatch(addNewChanges({ layerId, newChanges: ['position'] }));
        emitLayerPosition({ layerId, position: newImagePosition });
      }
    } else if (dragging && ['draw', 'erase'].includes(activeTool) && lastSelectedLayer) {
      colorPixelInCanvas(lastSelectedLayer._id, stageRef, e);
    }
  };

  const handleStageMouseUp = () => {
    setDragging(false);
    setDragStartPosition(null);
    setPoints([]);
  };

  const handleStageMouseLeave = () => {
    setDragging(false);
    setDragStartPosition(null);
    setHoveredRect(null);
    setHoverLayerId(null);
    setBrushOutline(null);
    setPoints([]);
  };

  useEffect(() => {
    if (activeTool === 'select') {
      setCursorStyle('default');
    } else if (activeTool === 'draw' || activeTool === 'erase' || activeTool === 'color-picker') {
      setCursorStyle('crosshair');
    }
  }, [stageData.scale, activeTool, brushSize]);

  // check state of newChanges every n seconds
  const [triggerCheck, setTriggerCheck] = useState(false);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTriggerCheck(!triggerCheck);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [triggerCheck]);

  // useEffect(() => {
  //   console.log(newChanges);
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
          {showGrid && <KonvaCheckerboardImage width={file.width} height={file.height} tileDimension={file.tileDimension} />}
          {layerElements}
          {hoveredRect}
          {selectedRects}
          {brushOutline}
        </Layer>
      </Stage>
    </Fragment>
  );
}
