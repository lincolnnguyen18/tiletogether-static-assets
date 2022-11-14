/** @jsx jsx */
import { jsx } from '@emotion/react';
import { floor, max } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { Image, Layer, Rect, Stage } from 'react-konva';
import { useDispatch, useSelector } from 'react-redux';
import { getURLImage } from 'src/utils/tileUtils';
import { selectLastSelectedTileSet, setMapEditorPrimitives } from './mapEditorSlice';

function URLImage ({ url, ...props }) {
  return <Image image={getURLImage(url)} {...props}/>;
}

let unit = 64;

export function TilesetSelector () {
  const dispatch = useDispatch();

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedPos, setSelectPos] = useState({ x: 0, y: 0 });
  const selectedTileset = useSelector(selectLastSelectedTileSet);

  const stageRef = useRef(null);

  useEffect(() => {
    if (selectedTileset) {
      const { width, height, tileDimension } = selectedTileset;
      unit = max([unit, tileDimension]);
      setCanvasSize({ width: width * unit, height: height * unit });
    }
  }, [selectedTileset]);

  // #region Uset Input Handles
  function handleMouseDown (e) {
    e.evt.preventDefault();
    if (!stageRef) return;

    const { x, y } = stageRef.current.getRelativePointerPosition();
    setSelectPos({ x: floor(x / unit), y: floor(y / unit) });
    dispatch(setMapEditorPrimitives({ selectedTileIndex: selectedPos.y * selectedTileset.width + selectedPos.x + 1 }));
  }

  function handleMouseUp (e) {
    e.evt.preventDefault();
    if (!stageRef) return;

    const { x, y } = stageRef.current.getRelativePointerPosition();
    setSelectPos({ x: floor(x / unit), y: floor(y / unit) });
    dispatch(setMapEditorPrimitives({ selectedTileIndex: selectedPos.y * selectedTileset.width + selectedPos.x + 1 }));
  }
  // #endregion

  return (
    <Stage
      width={256}
      height={256}
      x={0}
      y={0}
      scale={{ x: 1, y: 1 }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      ref={stageRef}
      style={{ top: 0, left: 0, cursor: 'crosshair', overflow: 'scroll' }}
    >
      <Layer>
        {selectedTileset &&
          <URLImage
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            url={selectedTileset.imageUrl}
          />
        }
        <Rect
          x={selectedPos.x * unit}
          y={selectedPos.y * unit}
          width={unit}
          height={unit}
          fill="red"
          opacity={0.5}
        />
      </Layer>
    </Stage>
  );
}
