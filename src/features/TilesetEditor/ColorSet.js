/** @jsx jsx */
import { css, jsx } from '@emotion/react';

function Color ({ color }) {
  const colorStyle = css`
    background: ${color};
    border: 1px solid #aaa;
    width: 21px;
    height: 21px;
    cursor: pointer;
  `;

  return (
    <div css={colorStyle} />
  );
}

export function ColorSet ({ colors }) {
  const colorSetStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
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
