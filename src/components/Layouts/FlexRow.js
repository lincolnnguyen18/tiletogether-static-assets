/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function FlexRow ({ children, gap = 0, justify = 'flex-start', style, ...props }) {
  const flexStyle = css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: ${justify};
    gap: ${gap}px;
  `;

  return (
    <div css={[flexStyle, style]} {...props}>
      {children}
    </div>
  );
}
