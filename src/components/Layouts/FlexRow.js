/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const flexStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export function FlexRow ({ children, style, ...props }) {
  return (
    <div css={[flexStyle, style]} {...props}>
      {children}
    </div>
  );
}
