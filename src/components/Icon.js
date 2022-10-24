/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function Icon ({
  iconSize = 36,
  size = 40,
  children,
  onClick,
  color = 'var(--off-white)',
  style,
}) {
  const iconStyle = css`
    & {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      justify-content: center;
      align-items: center;
  
      color: ${color};
      border: none;
      background: none;
      user-select: none;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    
    & span {
      font-size: ${iconSize}px;
    }
  `;

  return (
    <div css={[iconStyle, style]} onClick={onClick}>
      {children}
    </div>
  );
}
