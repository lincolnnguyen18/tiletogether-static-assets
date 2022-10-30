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
  z-index: 1;

  .header {
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: center;
  }
`;

const colorSetStyle = css`
  display: flex;
  flex-wrap: wrap;
`;

export function RightSidebar () {
  function getRandomColor () {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }

  function color ({ color, key }) {
    const colorStyle = css`
      background: ${color};
      width: 32px;
      height: 32px;
      border: 2px solid #aaa;
      cursor: pointer;
    `;

    return (
      <div css={colorStyle} key={key} />
    );
  }

  return (
    <div css={leftSidebarStyle}>
      <div className='header'>
        <Icon color='white'>
          <span className='icon-paint-roller'></span>
        </Icon>
        <span>Color set</span>
      </div>
      <div css={colorSetStyle}>
        {[...Array(10)].map((_, index) => color({ color: getRandomColor(), key: index }))}
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
