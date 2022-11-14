/** @jsx jsx */
import { jsx } from '@emotion/react';
import { Layer } from 'react-konva';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import { getTileRect } from 'src/utils/tileUtils';
import { Tile } from './Tile';
import { selectMapFile } from '../mapEditorSlice';

export function MapLayers () {
  const file = useSelector(selectMapFile);
  const layers = file.rootLayer.layers;

  return layers.map(layer => <TileLayer key={`Layer${layer.name}`} layer={layer} tileDimension={file.tileDimension} fileWidth={file.width} fileheight={file.height}/>);
}

function TileLayer ({ layer, tileDimension, fileWidth, fileheight }) {
  return (
    <Layer>
      {layer.tiles.map((tile, tileIndex) => tile === 0
        ? null
        : <Tile
          key={_.uniqueId(`${layer.name}Tile${tile}`)}
          visible={layer.visible}
          rect={getTileRect(tileDimension, fileWidth, fileheight, tileIndex)}
          index={tile}
        />)
      }
    </Layer>
  );
}
