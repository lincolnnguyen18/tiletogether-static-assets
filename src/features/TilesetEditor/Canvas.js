import React, { useEffect, useState } from 'react';
import { Image, Layer, Stage } from 'react-konva';
import { useSelector } from 'react-redux';

export function Canvas () {
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [stageZoom, setStageZoom] = useState(8);
  const [image, setImage] = useState(null);
  const fileSlice = useSelector((state) => state.file);
  const layers = fileSlice.file.rootLayer.layers;
  // eslint-disable-next-line no-unused-vars
  const layer1 = layers[0];

  useEffect(() => {
    // TODO: replace url with layer's AWS S3 tilesetLayerUrl once API has been updated to use S3
    // const url = layer1.tilesetLayerUrl;
    const url = '/mock-data/file-image.png';
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage(img);
    };
  }, [layers]);

  async function handleWheel (e) {
    const dx = -e.evt.deltaX * 0.5;
    const dy = -e.evt.deltaY * 0.5;

    // if control not being pressed, pan
    if (!e.evt.ctrlKey) {
      const x = stagePosition.x + dx;
      const y = stagePosition.y + dy;
      setStagePosition({ x, y });
    // else zoom
    } else {
      const oldScale = stageZoom;

      const mousePointTo = {
        x: (e.evt.clientX - stagePosition.x) / oldScale,
        y: (e.evt.clientY - stagePosition.y) / oldScale,
      };

      const direction = -e.evt.deltaY;
      const newScale = oldScale + direction / 200 * oldScale;
      if (newScale < 1 || newScale > 30) {
        return;
      }
      setStageZoom(newScale);

      const newPos = {
        x: e.evt.clientX - mousePointTo.x * newScale,
        y: e.evt.clientY - mousePointTo.y * newScale,
      };
      setStagePosition(newPos);
    }
  }

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onWheel={handleWheel}
      x={stagePosition.x}
      y={stagePosition.y}
      scaleX={stageZoom}
      scaleY={stageZoom}
    >
      <Layer imageSmoothingEnabled={false}>
        <Image image={image} x={10} y={10} />
      </Layer>
    </Stage>
  );
}
