/** @jsx jsx */
import { jsx } from '@emotion/react';
import { useSelector } from 'react-redux';
import { Image } from 'react-konva';
import { selectMapFile } from '../mapEditorSlice';
import { getTileImage } from 'src/utils/tileUtils';

export function Tile ({ visible, rect, index }) {
  const file = useSelector(selectMapFile);
  const { image, crop } = getTileImage(file.tilesets, file.startIndices, index);

  return (
    <Image
      image={image}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      crop={crop}
      visible={visible}
    />
  );
}
