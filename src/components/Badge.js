/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function Badge ({
  size = 40,
  iconSize = 48,
  color = 'black',
  backgroundColor = 'white',
  children,
  onClick,
  style,
}) {
  const badgeStyle = css`
    & {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      justify-content: center;
      align-items: center;
  
      border-radius: ${size / 8}px;
      border: none;
      background: ${backgroundColor};
      user-select: none;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    
    & span {
      font-size: ${iconSize}px;
      color: ${color};
    }
  `;

  return (
    <div css={[badgeStyle, style]} onClick={onClick}>
      {children}
    </div>
  );
}
