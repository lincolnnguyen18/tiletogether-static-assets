/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const flex = css`
  display: flex;
  flex-direction: column;
`;

export function FlexColumn ({ children, style, ...props }) {
  return (
    <div css={[flex, style]} {...props}>
      {children}
    </div>
  );
}
