/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../components/Icon';

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
  padding: 16px 0;
  box-sizing: border-box;
  gap: 16px;
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
`;

export function RightSidebar () {
  return (
    <div css={rightSidebarStyle}>
      <div>
        <div className='header'>
          <Icon color='white'>
            <span className='icon-paint-roller'></span>
          </Icon>
          <span>Tilesets</span>
        </div>
      </div>
      <div>
        <div className='header'>
          <Icon color='white'>
            <span className='icon-droplet'></span>
          </Icon>
          <span>Selected Tiles</span>
        </div>
        <div className='selected-tiles'>
          <canvas></canvas>
        </div>
      </div>
      <div className='header'>
        <Icon color='white'>
          <span className='icon-layers'></span>
        </Icon>
        <span>Layers</span>
      </div>
    </div>
  );
}
