/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../components/Icon';

const leftSidebarStyle = css`
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

  .header {
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: center;
  }
`;

export function RightSidebar () {
  return (
    <div css={leftSidebarStyle}>
      <div className='header'>
        <Icon color='white'>
          <span className='icon-paint-roller'></span>
        </Icon>
        <span>Color set</span>
      </div>
      <div className='header'>
        <Icon color='white'>
          <span className='icon-droplet'></span>
        </Icon>
        <span>Current color</span>
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
