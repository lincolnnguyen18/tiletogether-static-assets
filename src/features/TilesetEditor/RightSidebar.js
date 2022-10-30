/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../components/Icon';
import { ColorSet } from './ColorSet';
import _ from 'lodash';
import { Divider } from '../MapEditor/RightSidebar';
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

  .layers {
    padding-left: 10px;
    height: 100%;
    overflow: auto;
  }
`;

function getRandomColor () {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export function RightSidebar () {
  const colors = _.range(0, 80).map(() => getRandomColor());
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
        <span>Color set</span>
      </div>
      <ColorSet colors={colors} />
      <Divider />
      <div className={'current-color'}>
        <div className='header'>
          <Icon color='white'>
            <span className='icon-droplet'></span>
          </Icon>
          <span>Current color</span>
        </div>
        <input type="color" />
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
