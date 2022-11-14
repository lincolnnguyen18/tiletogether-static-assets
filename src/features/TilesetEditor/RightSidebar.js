/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../components/Icon';
import { Divider } from '../MapEditor/RightSidebar';
import { useDispatch, useSelector } from 'react-redux';
import { FlexRow } from '../../components/layout/FlexRow';
import { Slider } from '../../components/inputs/Slider';
import { Text } from '../../components/Text';
import { IconButton } from '../../components/inputs/IconButton';
import { addNewChanges, addNewTilesetLayer, deleteSelectedLayers, selectTilesetEditorPrimitives, selectTilesetFile, setTilesetEditorPrimitives, updateLayer } from './tilesetEditorSlice';
import { TilesetLayer } from './TilesetLayer';
import { useEffect } from 'react';
import { selectTilesetRightSidebarPrimitives, setTilesetRightSidebarPrimitives } from './rightSidebarSlice';
import { HexColorInput, HexColorPicker } from 'react-colorful';

const colorPickerStyle = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;

  .react-colorful {
    width: 200px;
    height: 200px;
    padding: 0;
    margin: 0 auto;
  }

  input {
    & {
      background: #f6f6f6;
      color: black;
      border: 1px solid #ccc;
      width: 80px;
      height: 36px;
      font-size: 16px;
      border-radius: 4px;
      outline: none;
      text-align: center;
      margin: 0 auto;
    }

    &::placeholder {
      color: var(--placeholder-color);
    }

    &:focus {
      background: #fff;
      outline: 1px solid black;
    }
  }
`;

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
  const primitives = useSelector(selectTilesetRightSidebarPrimitives);
  const { brushColor } = primitives;
  const editorPrimitives = useSelector(selectTilesetEditorPrimitives);
  const { lastSelectedLayer } = editorPrimitives;
  const file = useSelector(selectTilesetFile);
  const rootLayer = file.rootLayer;

  function handleOpacityChange (e) {
    const newOpacity = e.target.value / 100;
    // console.log('opacity change', newOpacity);
    const newLayer = { ...lastSelectedLayer, opacity: newOpacity };
    dispatch(updateLayer({ newLayer }));
    dispatch(addNewChanges({ layerId: lastSelectedLayer._id, newChanges: ['treeData'] }));
    dispatch(setTilesetEditorPrimitives({ lastSelectedLayer: newLayer }));
  }

  function handleAddNewLayer () {
    dispatch(addNewTilesetLayer());
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
      <div className={'current-color'}>
        <div className='header'>
          <Icon color='white'>
            <span className='icon-droplet'></span>
          </Icon>
          <span>Current color</span>
        </div>
      </div>
      <Divider />
      <div css={colorPickerStyle}>
        <HexColorPicker
          color={brushColor.toUpperCase()}
          onChange={(color) => dispatch(setTilesetRightSidebarPrimitives({ brushColor: color.toUpperCase() }))}
        />
        <HexColorInput
          color={brushColor.toUpperCase()}
          onChange={(color) => dispatch(setTilesetRightSidebarPrimitives({ brushColor: color.toUpperCase() }))}
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
        {lastSelectedLayer && (
          <FlexRow gap={8}>
            <Slider
              value={lastSelectedLayer.opacity * 100}
              onChange={handleOpacityChange}
            />
            <Text>{Math.round(lastSelectedLayer.opacity * 100)}%</Text>
          </FlexRow>
        )}
      </FlexRow>
      <div className='layers'>
        <TilesetLayer layer={rootLayer} level={-1} />
      </div>
    </div>
  );
}
