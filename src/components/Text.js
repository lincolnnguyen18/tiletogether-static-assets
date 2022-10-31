/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function Text ({ size = 14, color = 'white', style, ...props }) {
  const textStyle = css`
    font-size: ${size}px;
    color: ${color};
  `;

  return (
    <span css={[textStyle, style]} {...props} />
  );
}
