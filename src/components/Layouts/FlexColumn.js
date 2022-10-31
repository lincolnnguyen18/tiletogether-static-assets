/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function FlexColumn ({ children, gap = 0, style, ...props }) {
  const flexStyle = css`
    display: flex;
    flex-direction: column;
    gap: ${gap}px;
  `;

  return (
    <div css={[flexStyle, style]} {...props}>
      {children}
    </div>
  );
}
