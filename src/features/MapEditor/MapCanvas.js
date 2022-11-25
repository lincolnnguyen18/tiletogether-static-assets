/** @jsx jsx */
import { jsx } from '@emotion/react';
import { Group, Image, Layer, Rect, Stage } from 'react-konva';
import { useEffect, useRef, useState } from 'react';
import { downloadFileAsCanvas, KonvaCheckerboardImage } from '../TilesetEditor/TilesetCanvas';
import { useDispatch, useSelector } from 'react-redux';
import { selectLeftSidebarPrimitives, setLeftSidebarPrimitives } from '../Editor/leftSidebarSlice';
import { addNewChanges, asyncSaveChanges, clearChanges, selectBrushCanvas, selectLastSelectedLayer, selectLayerData, selectLayerTiles, selectMapEditorPrimitives, selectMapFile, selectMapNewChanges, setBrushCanvas, setLayerData, setMapEditorPrimitives, updateAllLayers, updateLayer, updateLayersUpToRoot, updateLayerTiles } from './mapEditorSlice';
import { initializeAElement, trimPng } from '../../utils/canvasUtils';
import _ from 'lodash';
import { onChangesSaved } from '../TilesetEditor/tilesetEditorSocketApi';

export function MapCanvas () {
  const { showGrid, drawerOpen } = useSelector(selectLeftSidebarPrimitives);
  const { activeTool, brushTileIndices, savingChanges, downloadFormat, reuploadingFileImage } = useSelector(selectMapEditorPrimitives);
  const file = useSelector(selectMapFile);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  const [stageData, setStageData] = useState({ scale: 2, position: { x: 0, y: 0 } });
  const [cursorStyle, setCursorStyle] = useState('crosshair');
  const stageRef = useRef();
  const [dragging, setDragging] = useState(false);
  const lastSelectedLayer = useSelector(selectLastSelectedLayer);
  const brushCanvas = useSelector(selectBrushCanvas);
  const layerTiles = useSelector(selectLayerTiles);
  const [brushOutline, setBrushOutline] = useState(null);
  const layerData = useSelector(selectLayerData);
  const [relativeTilePosition, setRelativeTilePosition] = useState(null);
  const [layerElements, setLayerElements] = useState([]);
  const [hoveredRect, setHoveredRect] = useState(null);
  const [hoverLayerId, setHoverLayerId] = useState(null);
  const [selectedRects, setSelectedRects] = useState([]);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const newChanges = useSelector(selectMapNewChanges);
  const layers = file.rootLayer.layers;
  const dispatch = useDispatch();

  useEffect(() => {
    if (!downloadFormat || !file.rootLayer) return;
    // console.log('downloadFormat', downloadFormat);

    // // download canvas as png
    initializeAElement();
    const canvas = downloadFileAsCanvas({ file, layerData });
    const a = window.aElement;
    a.href = canvas.toDataURL('image/png');
    a.download = `${file.name}.${downloadFormat}`;
    a.click();

    // open canvas in new tab
    // const w = window.open();
    // w.document.body.appendChild(canvas);
    // w.document.close();

    dispatch(setMapEditorPrimitives({ downloadFormat: null }));
    dispatch(setLeftSidebarPrimitives({ drawerOpen: false }));
  }, [downloadFormat, file]);

  useEffect(() => {
    if (reuploadingFileImage) {
      // console.log('reuploadingFileImage', reuploadingFileImage);
      dispatch(addNewChanges({ layerId: 'all', newChanges: ['canvas'] }));
      // console.log(file.width, file.height);
      dispatch(asyncSaveChanges());
      dispatch(setMapEditorPrimitives({ reuploadingFileImage: false }));
    }
  }, [reuploadingFileImage]);

  useEffect(() => {
    if (!brushCanvas) {
      // console.log('no brush canvas');
      setBrushOutline(null);
    }
  }, [brushCanvas]);

  useEffect(() => {
    dispatch(setBrushCanvas(null));
  }, []);

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

        // if new position is same as old position then don't update
        if (window.lastPosition && window.lastPosition.x === newLayer.position.x && window.lastPosition.y === newLayer.position.y) {
          // console.log('same position');
          return;
        }
        window.lastPosition = newLayer.position;

        const newLayerData = { ...layerData };
        newLayerData[layerId] = newLayer;
        dispatch(setLayerData(newLayerData));

        dispatch(addNewChanges({ layerId, newChanges: ['position'] }));
      }
    } else if (dragging && ['draw', 'erase'].includes(activeTool) && lastSelectedLayer) {
      paintTilesetOnCanvas(lastSelectedLayer._id, e);
    }
  }

  const handleStageMouseUp = () => {
    setDragging(false);
    setDragStartPosition(null);
  };

  function handleStageMouseDown (e) {
    if (lastSelectedLayer && (
      activeTool === 'draw' || activeTool === 'erase'
    )) {
      // console.log('updateLayer');
      paintTilesetOnCanvas(lastSelectedLayer._id, e);
    } else if (e.target.attrs.name === undefined && activeTool === 'select') {
      // clear selection if click on stage
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setMapEditorPrimitives({ lastSelectedLayer: null }));
    }
  }

  function paintTilesetOnCanvas (layerId, e) {
    const layer = layerData[layerId];
    // tiles: [new Schema({
    //   index: { type: Number, required: true },
    //   tileset: { type: Schema.Types.ObjectId, ref: 'File', required: true },
    // })],
    // const newTiles = [];
    // console.log('paintTilesetOnCanvas layer', layer);
    let layerPosition = layer ? { x: layer.position.x, y: layer.position.y } : null;
    if (!layerPosition) {
      layerPosition = relativeTilePosition;
    }
    if (!layerPosition) return;
    let layerCanvas = layer ? layer.canvas : null;
    // console.log('layerCanvas', layerCanvas);
    let newLayerTiles = layerTiles[layerId] ? _.cloneDeep(layerTiles[layerId]) : null;
    // console.log('newLayerTiles', newLayerTiles);

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

    if (!relativeLayerPosition || !relativeTilePosition) return;

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

    // if extending layer
    if ((overflows.left > 0 || overflows.right > 0 || overflows.top > 0 || overflows.bottom > 0) && e.evt.shiftKey && activeTool === 'draw') {
      setDragging(true);
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
      // console.log('brushRect', brushRect);

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
      dispatch(setLayerData(newLayerData));
      stageRef.current.draw();

      // calculate new layer tiles and update
      // console.log('extending layerTiles', newLayerTiles);
      // console.log('brushTileIndices', brushTileIndices);

      // calculate new width and height of layerTiles 2d array
      const newLayerTilesWidth = newLayerTiles[0].length + overflows.left + overflows.right;
      const newLayerTilesHeight = newLayerTiles.length + overflows.top + overflows.bottom;
      // console.log('newLayerTilesWidth', newLayerTilesWidth);
      // console.log('newLayerTilesHeight', newLayerTilesHeight);

      // create new 2d array
      const newLayerTiles2d = [];
      for (let i = 0; i < newLayerTilesHeight; i++) {
        newLayerTiles2d.push([]);
        for (let j = 0; j < newLayerTilesWidth; j++) {
          newLayerTiles2d[i].push(null);
        }
      }

      // copy newLayerTiles into newLayerTiles2d
      for (let i = 0; i < newLayerTiles.length; i++) {
        for (let j = 0; j < newLayerTiles[i].length; j++) {
          let newValue = newLayerTiles[i][j];
          if (activeTool === 'erase') {
            newValue = null;
          }
          newLayerTiles2d[i + overflows.top][j + overflows.left] = newValue;
        }
      }
      // console.log('newLayerTiles2d', newLayerTiles2d);

      const copyPosition = {
        y: Math.max(0, relativeTilePosition.y - relativeLayerPosition.y),
        x: Math.max(0, relativeTilePosition.x - relativeLayerPosition.x),
      };
      // console.log('copyPosition', copyPosition);

      // copy brushTileIndices into new 2d array
      for (let i = 0; i < brushTileIndices.length; i++) {
        for (let j = 0; j < brushTileIndices[i].length; j++) {
          newLayerTiles2d[i + copyPosition.y][j + copyPosition.x] = brushTileIndices[i][j];
        }
      }
      // console.log('newLayerTiles2d', newLayerTiles2d);

      // update layerTiles[layerId]
      dispatch(updateLayerTiles({ layerId, tiles: newLayerTiles2d }));
      // console.log('extending layerTiles', newLayerTiles2d);

      dispatch(addNewChanges({ layerId, newChanges: ['canvas', 'position'] }));
    // if starting new layer
    } else if ((!layer || layer.canvas == null) && activeTool === 'draw') {
      setDragging(true);
      brushRect = {
        x: (relativeTilePosition.x - layerPosition.x) * file.tileDimension,
        y: (relativeTilePosition.y - layerPosition.y) * file.tileDimension,
        width: brushCanvas.width,
        height: brushCanvas.height,
      };
      // console.log('brushRect', brushRect);

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
      dispatch(setLayerData(newLayerData));

      // update layerTiles
      newLayerTiles = brushTileIndices;
      dispatch(updateLayerTiles({ layerId, tiles: newLayerTiles }));
      // console.log('starting layerTiles', newLayerTiles);
      dispatch(addNewChanges({ layerId, newChanges: ['canvas', 'position'] }));
    // if drawing inside existing layer
    } else if (['draw', 'erase'].includes(activeTool)) {
      setDragging(true);
      // console.log('drawing on old canvas');
      brushRect = {
        x: (relativeTilePosition.x - relativeLayerPosition.x) * file.tileDimension,
        y: (relativeTilePosition.y - relativeLayerPosition.y) * file.tileDimension,
        width: brushCanvas.width,
        height: brushCanvas.height,
      };
      // console.log('brushRect', brushRect);

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
      dispatch(setLayerData(newLayerData));

      // console.log('newLayerTiles', newLayerTiles);
      // console.log('brushIndices', brushTileIndices);

      const copyPosition = {
        y: Math.max(0, relativeTilePosition.y - relativeLayerPosition.y),
        x: Math.max(0, relativeTilePosition.x - relativeLayerPosition.x),
      };

      // copy brushTileIndices into layerTiles
      try {
        for (let i = 0; i < brushTileIndices.length; i++) {
          for (let j = 0; j < brushTileIndices[i].length; j++) {
            let newValue = brushTileIndices[i][j];
            if (activeTool === 'erase') {
              newValue = null;
            }
            // detect overflows and crop overflowed tiles from newValue
            if (copyPosition.y + i < 0 || copyPosition.y + i >= newLayerTiles.length) {
              continue;
            }
            if (copyPosition.x + j < 0 || copyPosition.x + j >= newLayerTiles[0].length) {
              continue;
            }
            newLayerTiles[i + copyPosition.y][j + copyPosition.x] = newValue;
            // console.log('updating (i, j)', i + copyPosition.y, j + copyPosition.x);
            // console.log('taking from (i, j)', i, j);
          }
        }
      } catch (e) {}

      // update layerTiles
      dispatch(updateLayerTiles({ layerId, tiles: newLayerTiles }));
      // console.log('drawing on old layerTiles', newLayerTiles);
      dispatch(addNewChanges({ layerId, newChanges: ['canvas', 'position'] }));
    }
  }

  useEffect(() => {
    const newSelectedRects = [];
    function traverse (layer) {
      if (layer.type === 'layer' && layer.selected && layerData[layer._id]) {
        try {
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
        } catch (e) {
          console.error('WEIRD ERROR', e);
        }
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
      if (!mousePosition || !stagePosition || !stageScale) return;
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
            x={tilePosition.x - 2 / stageScale}
            y={tilePosition.y - 2 / stageScale}
            width={brushCanvas.width + 4 / stageScale}
            height={brushCanvas.height + 4 / stageScale}
            stroke={outerStrokeColor}
            strokeWidth={2 / stageData.scale}
            // dash={[10 / stageData.scale, 10 / stageData.scale]}
            listening={false}
            key={1}
          />,
        );
        newBrushOutline.push(
          <Rect
            x={tilePosition.x - 1 / stageScale}
            y={tilePosition.y - 1 / stageScale}
            width={brushCanvas.width + 2 / stageScale}
            height={brushCanvas.height + 2 / stageScale}
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
    if (activeTool === 'select' || (
      activeTool === 'draw' && !e.evt.shiftKey &&
      // don't focus on this layer if a new blank layer is being selected
      (!lastSelectedLayer || layerData[lastSelectedLayer._id] !== undefined)
    )) {
      // console.log('focus on layer', layer._id);
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

      if (lastSelectedLayer && layer._id === lastSelectedLayer._id) {
        // console.log('layer already selected');
        return;
      }
      // console.log('focus on layer again', layer._id);
      // if shift and command and ctrl not pressed then clear all selected layers
      if (!e.evt.shiftKey && !e.evt.ctrlKey && !e.evt.metaKey) {
        dispatch(updateAllLayers({ selected: false }));
        dispatch(setMapEditorPrimitives({ lastSelectedLayer: null }));
        // console.log('clear all selected layers');
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

  // useEffect(() => {
  //   console.log('lastSelectedLayer', lastSelectedLayer);
  // }, [lastSelectedLayer]);

  async function handleKeyDown (e) {
    if (e.key === '1') {
      dispatch(setMapEditorPrimitives({ activeTool: 'draw' }));
    } else if (e.key === '2') {
      dispatch(setMapEditorPrimitives({ activeTool: 'erase' }));
    } else if (e.key === '3') {
      dispatch(setMapEditorPrimitives({ activeTool: 'select' }));
    } else if (e.key === 'T') {
      // console.log('trim');
      e.preventDefault();
      // console.log(lastSelectedLayer);
      if (!lastSelectedLayer) return;
      const inputCanvas = layerData[lastSelectedLayer._id].canvas;
      if (!inputCanvas) return;
      // console.log('trimming', inputCanvas.width, inputCanvas.height);
      const { trimmedImageData, overflows } = trimPng(inputCanvas, file.tileDimension);
      // console.log('trimmed', trimmedImageData.width, trimmedImageData.height);
      // console.log('overflows', overflows);

      const tiles = layerTiles[lastSelectedLayer._id];
      // console.log('tiles', tiles);

      function trimTiles () {
        // remove edges from all sides of 2d array until non-null value is found
        const newEdge = {
          top: null,
          left: null,
          right: null,
          bottom: null,
        };
        let x;
        let y;

        for (x = 0; x < tiles[0].length; x++) {
          for (y = 0; y < tiles.length; y++) {
            if (tiles[y][x] != null) {
              if (newEdge.top === null) {
                newEdge.top = y;
              }
              if (newEdge.left === null || x < newEdge.left) {
                newEdge.left = x;
              }
              if (newEdge.right === null || newEdge.right < x) {
                // console.log('x', x);
                newEdge.right = x;
              }
              if (newEdge.bottom === null || newEdge.bottom < y) {
                newEdge.bottom = y;
              }
            }
          }
        }

        // console.log('newEdge', newEdge);
        // based on new edges, create new 2d array
        const newTiles = [];
        for (y = newEdge.top; y <= newEdge.bottom; y++) {
          newTiles.push(tiles[y].slice(newEdge.left, newEdge.right + 1));
        }

        return newTiles;
      }

      const trimmedTiles = trimTiles();
      // console.log('trimmedTiles', trimmedTiles);

      const canvas = document.createElement('canvas');
      canvas.width = trimmedImageData.width;
      canvas.height = trimmedImageData.height;
      // console.log('trimmedImageData', trimmedImageData.width, trimmedImageData.height);
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
      dispatch(setLayerData(newLayerData));
      dispatch(updateLayerTiles({ layerId: lastSelectedLayer._id, tiles: trimmedTiles }));
      dispatch(addNewChanges({ layerId: lastSelectedLayer._id, newChanges: ['canvas', 'position'] }));
    // listen for ctrl or command + s to save
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // console.log('saving');
      if (savingChanges) {
        console.log('already saving');
        return;
      }
      if (Object.keys(newChanges).length === 0) {
        console.log('no changes to save');
        return;
      }
      // console.log('newChanges', newChanges);
      dispatch(asyncSaveChanges());
      dispatch(setMapEditorPrimitives({ savingChanges: true }));
    }
  }

  function handleStageMouseLeave () {
    setBrushOutline(null);
  }

  useEffect(() => {
    if (drawerOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [lastSelectedLayer, layerData, drawerOpen]);

  useEffect(() => {
    if (drawerOpen) return;
    onChangesSaved(() => {
      console.log('changes saved');
      dispatch(clearChanges());
      dispatch(setMapEditorPrimitives({ savingChanges: false }));
    });
  }, [drawerOpen]);

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
      onMouseLeave={handleStageMouseLeave}
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
