/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../components/Icon';
import { Layer } from '../Editor/Layer';
import { useSelector } from 'react-redux';
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

  .selected-tiles {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    
    canvas {
      background: #bfbfbf;
      width: 100%;
      height: 213px;
    }
  }
  
  .layers {
    padding-left: 10px;
    height: 100%;
    overflow: auto;
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
  const fileSlice = useSelector((state) => state.file);
  const file = fileSlice.file;
  const rootLayer = file.rootLayer;

  useEffect(() => {
    console.log(rootLayer);
  }, [file]);

  return (
    <div css={rightSidebarStyle}>
      <div className='header'>
        <Icon color='white'>
          <span className='icon-paint-roller'></span>
        </Icon>
        <span>Tilesets</span>
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
        <canvas></canvas>
      </div>
      <Divider />
      <div className='header'>
        <Icon color='white'>
          <span className='icon-layers'></span>
        </Icon>
        <span>Layers</span>
      </div>
      <div className='layers'>
        <Layer layer={rootLayer} />
      </div>
    </div>
  );
}
