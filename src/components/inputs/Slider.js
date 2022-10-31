/** @jsx jsx */
import { css, jsx } from '@emotion/react';
const sliderStyle = css`
  -webkit-appearance: none;
  width: 100%;
  height: 3px;
  border-radius: 7px;
  background: white;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 12px;
    background: white;
    cursor: pointer;
  }
`;

export function Slider ({ min = 0, max = 100, ...props }) {
  return (
    <input
      type='range'
      min={min}
      max={max}
      {...props}
      css={sliderStyle}
    />
  );
}
