/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch } from 'react-redux';
import { setTilesetRightSidebarPrimitives } from './rightSidebarSlice';

function Color ({ color }) {
  const dispatch = useDispatch();

  const colorStyle = css`
    background: ${color};
    border: 1px solid #aaa;
    width: 20px;
    height: 20px;
    cursor: pointer;
  `;

  return (
    <div
      css={colorStyle}
      onClick={() => dispatch(setTilesetRightSidebarPrimitives({ brushColor: color }))}
    />
  );
}

export function ColorSet ({ colors }) {
  const colorSetStyle = css`
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    height: 200px;
    overflow-y: scroll;
  `;

  const colorWrapStyle = css`
    display: grid;
    grid-template-columns: repeat(11, 1fr);
  `;

  return (
    <div css={colorSetStyle}>
      <div css={colorWrapStyle}>
        {colors.map((color, index) => <Color color={color} key={index} />)}
      </div>
    </div>
  );
}
