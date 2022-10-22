/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function Grid ({ children, itemWidth, gap, style }) {
  const gridStyle = css`
    display: grid;
    grid-gap: ${gap}px;
    grid-template-columns: repeat(auto-fill, minmax(${itemWidth}px, 1fr));
  `;

  return (
    <div css={[gridStyle, style]}>
      {children}
    </div>
  );
}
