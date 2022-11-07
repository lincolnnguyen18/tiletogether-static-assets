/** @jsx jsx */
import { css, jsx } from '@emotion/react';

export function IconButton ({
  children,
  size = 32,
  style,
  color = 'var(--off-white)',
  focusColor = '#6b6b6b',
  refProp,
  ...props
}) {
  const iconButtonStyle = css`
    & {
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
  
      color: ${color};
      cursor: pointer;
      border: none;
      background: none;
      user-select: none;
      box-sizing: border-box;
      flex-shrink: 0;
      border-radius: 40px;
      transition: background 0.1s ease-in;
    }
    
    & span {
      font-size: ${size}px;
    }

    &:focus {
      ${focusColor ? `background: ${focusColor};` : ''}
      box-shadow: none;
      outline: none;
    }
    
    &:disabled {
      pointer-events: none;
      opacity: 0.5;
    }
  `;

  return (
    <button
      css={[iconButtonStyle, style]}
      {...props}
      ref={refProp}
    >
      {children}
    </button>
  );
}
