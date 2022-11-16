/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../components/Icon';
import { useDispatch, useSelector } from 'react-redux';
import { FlexRow } from '../../components/layout/FlexRow';
import { IconButton } from '../../components/inputs/IconButton';
import { addNewMapLayer, asyncPatchFile, selectMapEditorStatuses, selectMapFile } from './mapEditorSlice';
import { MapLayer } from './MapLayer';
import { openAddTilesetModal } from './AddTilesetModal';
import { useEffect } from 'react';
import { selectMapRightSidebarPrimitives, setMapRightSidebarPrimitives } from './rightSidebarSlice';
import { TileSelector } from './TileSelector';

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
  const { selectedTileset, drawerOpen } = useSelector(selectMapRightSidebarPrimitives);
  const { patchFile } = useSelector(selectMapEditorStatuses);
  const rootLayer = file.rootLayer;
  const dispatch = useDispatch();

  function handleAddTileset () {
    openAddTilesetModal(dispatch);
  }

  async function handleDeleteTileset (tilesetId) {
    const confirm = window.confirm('Are you sure you want to remove this tileset from the map?');
    if (!confirm) return;
    const newTilesets = file.tilesets.filter(t => t._id !== tilesetId);
    await dispatch(asyncPatchFile({ id: file.id, updates: { tilesets: newTilesets } }));
    dispatch(setMapRightSidebarPrimitives({ selectedTileset: null }));
  }

  function handleAddNewLayer () {
    dispatch(addNewMapLayer());
  }

  function handleDeleteSelectedLayers () {
    console.log('delete selected layers');
    // TODO: implement
  }

  useEffect(() => {
    console.log(file.tilesets);
  }, [file.tilesets]);

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
            onClick={() => handleDeleteTileset(selectedTileset._id)}
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
              className={['tileset', selectedTileset?._id === tileset._id ? 'selected' : ''].join(' ')}
              key={index}
              onClick={() => {
                // console.log(tileset);
                dispatch(setMapRightSidebarPrimitives({ selectedTileset: tileset }));
                // console.log(selectedTileset);
              }}
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
