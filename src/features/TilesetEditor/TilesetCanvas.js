/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { Fragment, useEffect, useRef, useState } from 'react';
import { selectPrimitives } from './tilesetEditorSlice';
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

export function TilesetCanvas () {
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth - 56 - 270, height: window.innerHeight });
  const tilesetEditorSlice = useSelector((state) => state.tilesetEditor);
  const primitives = useSelector(selectPrimitives);
  const file = tilesetEditorSlice.file;
  const layers = file.rootLayer.layers;
  const dispatch = useDispatch();
  const [stageData, setStageData] = useState({ scale: 5, position: { x: 0, y: 0 } });
  const [layerImages, setLayerImages] = useState({});
  const [layerElements, setLayerElements] = useState([]);
  const stageRef = useRef(null);

  useEffect(() => {
    console.log(layers);

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
      const newLayerImages = {};
      Object.keys(layerIdToImageUrl).forEach((layerId) => {
        if (document.getElementById(layerId)) return;
        const canvas = trimPng(layerIdToImageUrl[layerId]);
        canvas.id = layerId;
        virtualCanvases.appendChild(canvas);
        newLayerImages[layerId] = canvas;
      });
      if (Object.keys(newLayerImages).length > 0) {
        setLayerImages(newLayerImages);
      }
    }

    loadImages();
  }, []);

  useEffect(() => {
    function layerToElement (layer, level) {
      if (layer == null) return null;
      if (layer.type === 'group') {
        return (
          <Group
            key={layer._id}
          >
            {layer.layers.map((layer) => layerToElement(layer, level + 1))}
          </Group>
        );
      } else if (layer.type === 'layer') {
        return (
          <Image
            key={layer._id}
            image={layerImages[layer._id]}
            x={layer.position.x}
            y={layer.position.y}
            name={layer._id}
            // stroke={'white'}
            // strokeWidth={1}
          />
        );
      }
    }

    const newLayerElements = layers.map((layer) => layerToElement(layer, 0));
    console.log(newLayerElements);
    setLayerElements(newLayerElements);
  }, [layerImages]);

  const handleStageMouseWheel = (e) => {
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
        // onMouseDown={handleStageMouseDown}
        // onMouseMove={handleStageMouseMove}
        // onMouseUp={handleStageMouseUp}
        style={{ position: 'absolute', top: 0, left: 56 }}
      >
        <Layer imageSmoothingEnabled={false}>
          {layerElements}
        </Layer>
      </Stage>
    </Fragment>
  );
}
