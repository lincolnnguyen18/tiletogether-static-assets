/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { IconButton } from './IconButton';

const iconLabel = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: white;
`;

export function IconButtonLabel ({ children, size, style, extraStyle, color = 'var(--off-white)', focusColor = '#6b6b6b', refProp, label, ...props }) {
  return (
    <div css={[iconLabel, extraStyle]}>
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
