/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../components/Icon';
import { ColorSet } from './ColorSet';
import { Divider } from '../MapEditor/RightSidebar';
import { useDispatch, useSelector } from 'react-redux';
import { FlexRow } from '../../components/layout/FlexRow';
import { Slider } from '../../components/inputs/Slider';
import { Text } from '../../components/Text';
import { IconButton } from '../../components/inputs/IconButton';
import { setTilesetRightSidebarPrimitives } from './rightSidebarSlice';
import { addNewTilesetLayer, deleteSelectedLayers, setTilesetEditorPrimitives } from './tilesetEditorSlice';
import { TilesetLayer } from './TilesetLayer';
import { useEffect } from 'react';

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

  .layers {
    height: 100%;
    overflow: auto;
  }
`;

export function RightSidebar () {
  const dispatch = useDispatch();
  const tilesetRightSidebarSlice = useSelector((state) => state.tilesetRightSidebar);
  const colors = tilesetRightSidebarSlice.primitives.colors;
  const currentColor = tilesetRightSidebarSlice.primitives.currentColor;
  const tilesetEditorSlice = useSelector((state) => state.tilesetEditor);
  const file = tilesetEditorSlice.file;
  const rootLayer = file.rootLayer;

  function handleAddNewLayer () {
    dispatch(addNewTilesetLayer());
  }

  function handleDeleteSelectedLayers () {
    dispatch(deleteSelectedLayers());
  }

  function handleRefreshColors () {
    dispatch(setTilesetEditorPrimitives({ calculateColors: true }));
  }

  function handleKeyDown (e) {
    // listen for shift + c to create a new layer
    if (e.key === 'C') {
      handleAddNewLayer();
    }
    // listen for delete or backspace to delete the selected layer
    if (e.key === 'Delete' || e.key === 'Backspace') {
      handleDeleteSelectedLayers();
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div css={rightSidebarStyle}>
      <FlexRow gap={8} justify="space-between">
        <FlexRow gap={4}>
          <Icon color='white'>
            <span className='icon-paint-roller'></span>
          </Icon>
          <span>Color set</span>
        </FlexRow>
        <IconButton onClick={handleRefreshColors}>
          <span className={'icon-refresh'}/>
        </IconButton>
      </FlexRow>
      <ColorSet colors={colors} />
      <Divider />
      <div className={'current-color'}>
        <div className='header'>
          <Icon color='white'>
            <span className='icon-droplet'></span>
          </Icon>
          <span>Current color</span>
        </div>
        <input
          type='color'
          value={currentColor}
          onChange={(e) => dispatch(setTilesetRightSidebarPrimitives({ currentColor: e.target.value }))}
        />
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
         <FlexRow gap={8}>
          <Slider value={100} />
          <Text>{100}%</Text>
         </FlexRow>
      </FlexRow>
      <div className='layers'>
        <TilesetLayer layer={rootLayer} level={-1} />
      </div>
    </div>
  );
}
