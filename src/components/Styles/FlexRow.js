/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const flex = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export function FlexRow ({ children, style, ...props }) {
  return (
    <div css={[flex, style]} {...props}>
      {children}
    </div>
  );
}
