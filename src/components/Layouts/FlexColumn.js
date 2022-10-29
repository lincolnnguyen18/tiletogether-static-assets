/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const flexStyle = css`
  display: flex;
  flex-direction: column;
`;

export function FlexColumn ({ children, style, ...props }) {
  return (
    <div css={[flexStyle, style]} {...props}>
      {children}
    </div>
  );
}
