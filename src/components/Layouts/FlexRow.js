/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function FlexRow ({ children, gap, style, ...props }) {
  const flexStyle = css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${gap || '0px'};
  `;

  return (
    <div css={[flexStyle, style]} {...props}>
      {children}
    </div>
  );
}
