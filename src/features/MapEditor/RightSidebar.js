/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../components/Icon';
import { useDispatch, useSelector } from 'react-redux';
import { FlexRow } from '../../components/layout/FlexRow';
import { IconButton } from '../../components/inputs/IconButton';
import { addNewMapLayer, assignFirstGuids, assignLayerTiles, assignTilesetCanvases, asyncPatchFile, deleteSelectedLayers, eraseTileInLayer, getCurrentGuids, selectFirstGuids, selectLayerTiles, selectMapEditorPrimitives, selectMapEditorStatuses, selectMapFile, selectTilesetCanvases, setBrushCanvas, setMapEditorPrimitives } from './mapEditorSlice';
import { MapLayer } from './MapLayer';
import { openAddTilesetModal } from './AddTilesetModal';
import { useEffect } from 'react';
import { TileSelector } from './TileSelector';
import { selectLeftSidebarPrimitives } from '../Editor/leftSidebarSlice';
import _ from 'lodash';

const rightSidebarStyle = css`
  background: #3F3F3F;
  width: 270px;
  display: flex;
  height: 100%;
  position: absolute;
  right: 0;
  flex-direction: column;
  color: white;
  overflow-y: auto;
  padding-top: 16px;
  box-sizing: border-box;
  z-index: 1;

  .header {
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: center;
  }

  .current-color {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 18px;
  }

  .selected-tiles {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
  }
  
  .layers {
    height: 100%;
    overflow: auto;
  }
`;

const tilesetsStyle = css`
  flex-wrap: wrap;
  gap: 7px;
  
  .tileset {
    padding: 8px;
    background: #2D2D2D;
    border-radius: 7px;
    cursor: pointer;
    
    &:hover {
      background: #4D4D4D;
    }
    
    &.selected {
      background: #73809A;
    }
    
    span {
      font-size: 14px;
    }
  }
`;

export function Divider () {
  const dividerStyle = css`
    width: 100%;
    height: 18px;
  `;

  return <div css={dividerStyle} />;
}

export function RightSidebar () {
  const file = useSelector(selectMapFile);
  const { brushTileset } = useSelector(selectMapEditorPrimitives);
  const { patchFile } = useSelector(selectMapEditorStatuses);
  const { drawerOpen } = useSelector(selectLeftSidebarPrimitives);
  const firstGuids = useSelector(selectFirstGuids);
  const layerTiles = useSelector(selectLayerTiles);
  const tilesetCanvases = useSelector(selectTilesetCanvases);
  const rootLayer = file.rootLayer;
  const dispatch = useDispatch();

  function handleAddTileset () {
    openAddTilesetModal(dispatch);
  }

  async function handleDeleteTileset (fileId) {
    const confirm = window.confirm('Are you sure you want to remove this tileset from the map?');
    if (!confirm) return;

    console.log('fileId', fileId);
    const currentGuids = getCurrentGuids({ firstGuids, file, tilesetCanvases });
    console.log('currentGuids', currentGuids);
    // console.log('firstGuids', firstGuids);
    console.log('layerTiles', layerTiles);
    const tilesetIndex = file.tilesets.findIndex(tileset => tileset.file === fileId);
    console.log('tilesetIndex', tilesetIndex);
    const firstGuid = currentGuids[tilesetIndex][0];
    const lastGuid = currentGuids[tilesetIndex][1];
    console.log('firstGuid', firstGuid);
    console.log('lastGuid', lastGuid);

    // remove all tiles with guid between firstGuid and lastGuid from all layers
    // remove from both layerTiles and tilesetCanvases
    // remove means set to null for layerTiles and set to transparent for tilesetCanvases
    const newLayerTiles = _.cloneDeep(layerTiles);
    Object.keys(layerTiles).forEach(layerId => {
      const newLayer = _.cloneDeep(layerTiles[layerId]);
      const height = newLayer.length;
      const width = newLayer[0].length;
      console.log('width', width);
      console.log('height', height);
      console.log(`removing tiles with guid from ${firstGuid} to ${lastGuid}`);
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const tile = layerTiles[layerId][i][j];
          if (tile >= firstGuid && tile <= lastGuid) {
            newLayer[i][j] = null;
            console.log(`setting tile at ${i}, ${j} to null`);
            dispatch(eraseTileInLayer({ layerId, y: i, x: j }));
          }
        }
      }
      // console.log(`newLayer ${layerId}`, newLayer);
      newLayerTiles[layerId] = newLayer;
    });
    dispatch(assignLayerTiles(newLayerTiles));
    console.log('newLayerTiles', newLayerTiles);

    const newTilesets = file.tilesets.filter(t => t.file !== fileId);
    if (newTilesets.length === file.tilesets.length) return;
    await dispatch(asyncPatchFile({ id: file.id, updates: { tilesets: newTilesets } }));
    dispatch(setMapEditorPrimitives({ brushTileset: null, brushTileIndices: null }));
    dispatch(setBrushCanvas(null));

    // update tilesetCanvases and firstGuids
    const newTilesetCanvases = _.cloneDeep(tilesetCanvases);
    delete newTilesetCanvases[fileId];
    dispatch(assignTilesetCanvases(newTilesetCanvases));
    const newFirstGuids = _.cloneDeep(firstGuids);
    delete newFirstGuids[fileId];
    dispatch(assignFirstGuids(newFirstGuids));
  }

  function handleAddNewLayer () {
    dispatch(addNewMapLayer());
  }

  function handleDeleteSelectedLayers () {
    dispatch(deleteSelectedLayers());
  }

  function handleKeyDown (e) {
    // listen for shift + c to create a new layer
    if (e.key === 'C') {
      handleAddNewLayer();
    }
    // listen for delete or backspace to delete the selected layer
    if ((e.key === 'Delete' || e.key === 'Backspace') && !drawerOpen) {
      handleDeleteSelectedLayers();
    }
  }

  // useEffect(() => {
  //   console.log(file.tilesets);
  // }, [file.tilesets]);

  useEffect(() => {
    // console.log(brushTileset);
    if (!brushTileset && file.tilesets.length) {
      // dispatch(assignMapRightSidebarPrimitives({ brushTileset: file.tilesets[file.tilesets.length - 1] }));
      dispatch(setMapEditorPrimitives({ brushTileset: file.tilesets[file.tilesets.length - 1] }));
    }
  }, [brushTileset, file.tilesets]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  return (
    <div css={rightSidebarStyle}>
      <FlexRow justify={'space-between'}>
        <FlexRow gap={4}>
          <Icon color='white'>
            <span className='icon-paint-roller'></span>
          </Icon>
          <span>Tilesets</span>
        </FlexRow>
        <FlexRow gap={7}>
          <IconButton
            onClick={handleAddTileset}
            disabled={patchFile === 'pending'}
          >
            <span className='icon-plus'></span>
          </IconButton>
          <IconButton
            onClick={() => handleDeleteTileset(brushTileset.file)}
            disabled={patchFile === 'pending'}
          >
            <span className='icon-trash'></span>
          </IconButton>
        </FlexRow>
      </FlexRow>
      <div css={css`height: 300px; overflow-y: scroll; padding: 4px 8px; user-select: none;`}>
        <FlexRow style={tilesetsStyle} align={'flex-start'}>
          {file.tilesets.map((tileset, index) => (
            <div
              className={['tileset', brushTileset?.file === tileset.file ? 'selected' : ''].join(' ')}
              key={index}
              onClick={() => {
                if (patchFile === 'pending') return;
                // console.log('tileset', tileset);
                // console.log('brushTileset', brushTileset);
                dispatch(setMapEditorPrimitives({ brushTileset: tileset }));
              }}
              style={{ pointerEvents: patchFile === 'pending' ? 'none' : 'auto' }}
            >
              <span>{tileset.name}</span>
            </div>
          ))}
        </FlexRow>
      </div>
      <Divider />
      <div className='header'>
        <Icon color='white'>
          <span className='icon-droplet'></span>
        </Icon>
        <span>Selected Tiles</span>
      </div>
      <Divider />
      <div className='selected-tiles'>
        <TileSelector />
      </div>
      <Divider />
      <div className='header'>
        <Icon color='white'>
          <span className='icon-layers'></span>
        </Icon>
        <span>Layers</span>
      </div>
      <FlexRow justify={'space-between'} gap={24} style={{ paddingRight: 12, paddingBottom: 6 }}>
        <FlexRow>
          <IconButton onClick={handleAddNewLayer}>
            <span className='icon-plus'></span>
          </IconButton>
          <IconButton onClick={handleDeleteSelectedLayers}>
            <span className='icon-trash'></span>
          </IconButton>
        </FlexRow>
      </FlexRow>
      <div className='layers'>
        <MapLayer layer={rootLayer} level={-1} />
      </div>
    </div>
  );
}
