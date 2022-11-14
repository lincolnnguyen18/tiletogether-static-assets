import _ from 'lodash';
import useImage from 'use-image';

// #region Load Image Helper
const tilesetImages = new Map();

export function getURLImage (url) {
  if (!url) return null;
  if (!tilesetImages.has(url)) {
    const [img] = useImage(url);
    tilesetImages[url] = img;
  }
  return tilesetImages[url];
}

export function getTileImage (tilesets, startIndices, index) {
  let url = '';
  let targetTileset;
  let targetIndex;

  for (let i = 0; i < tilesets.length; i++) {
    const tileset = tilesets[i];
    const startIndex = startIndices[i];
    const size = tileset.width * tileset.height;
    if (index >= startIndex && index < startIndex + size) {
      url = tileset.imageUrl;
      targetTileset = tileset;
      targetIndex = index - startIndex;
    }
  }

  return { image: getURLImage(url), crop: getCrop(targetTileset, targetIndex) };
}
// #endregion

// #region Rect Helper
function getCrop (tileset, index) {
  const dimension = tileset.tileDimension;
  const yIndex = Math.floor(index / tileset.width);
  const xIndex = index - yIndex * tileset.width;

  return {
    x: xIndex * dimension,
    y: yIndex * dimension,
    width: dimension,
    height: dimension,
  };
}

export function getTileRect (dimension, width, height, index) {
  const yIndex = Math.floor(index / width);
  const xIndex = index - yIndex * width;
  if (yIndex >= height) alert(`Found ${yIndex} rows on a Tile Map of height ${height}`);

  return {
    x: xIndex * dimension,
    y: yIndex * dimension,
    width: dimension,
    height: dimension,
  };
}

export function getEditTileInfo (file, layer, tileset, startIndices, tilesetTileIndex, mapTileIndex) {
  const rootLayer = file.rootLayer;
  const layerIndex = rootLayer.layers.findIndex(l => l._id === layer._id);
  const tilesetIndex = file.tilesets.findIndex(t => t._id === tileset._id);

  const newRootLayer = _.cloneDeep(rootLayer);
  newRootLayer.layers[layerIndex].tiles[mapTileIndex] = tilesetTileIndex + startIndices[tilesetIndex];

  return newRootLayer;
}
// #endregion
