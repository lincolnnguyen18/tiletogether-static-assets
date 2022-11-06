/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function FlexRow ({ children, gap = 0, style, ...props }) {
  const flexStyle = css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${gap}px;
  `;

  return (
    <div css={[flexStyle, style]} {...props}>
      {children}
    </div>
  );
}
