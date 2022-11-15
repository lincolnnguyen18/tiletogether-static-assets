/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { selectMapRightSidebarPrimitives } from './rightSidebarSlice';
import { Image, Layer, Stage } from 'react-konva';
import { selectTilesetCanvases } from './mapEditorSlice';

const canvasStyle = css`
  background: #bfbfbf;
  width: 100%;
  height: 213px;
`;

export function TileSelector () {
  const rightSidebarPrimitives = useSelector(selectMapRightSidebarPrimitives);
  const { selectedTileset } = rightSidebarPrimitives;
  const tilesetCanvases = useSelector(selectTilesetCanvases);

  useEffect(() => {
    console.log('selectedTileset', selectedTileset);
  }, [selectedTileset]);

  return (
    <Stage width={254} height={213} css={canvasStyle}>
      <Layer imageSmoothingEnabled={false}>
        <Image image={selectedTileset && tilesetCanvases[selectedTileset.file]} />
      </Layer>
    </Stage>
  );
}
