/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { IconButton } from './IconButton';

const iconLabel = css`
  display: inline;
  margin: 30px 0;
`;

export function IconButtonLabel ({ children, size, style, color = 'var(--off-white)', focusColor = '#6b6b6b', refProp, label, ...props }) {
  return (
    <div css={iconLabel}>
      <IconButton
        size={size}
        style={style}
        color={color}
        focusColor={focusColor}
        refProp={refProp}
        props={props}
      >
      {children}
      </IconButton>
      {label}
    </div>
  );
}
