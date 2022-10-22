/** @jsx jsx */
import { jsx, css } from '@emotion/react';

export const blackButtonStyle = css`
  background: var(--gray);
  color: white;

  &:focus-visible {
    outline: 2px solid var(--outline-color);
  }

  &:active {
    background: #3b3b3b;
  }

  &:focus {
    outline: 2px solid #e3e3e3;
  }
`;

export const whiteButtonStyle = css`
  & {
    background: var(--off-white);
    color: var(--gray);
  }
  
  &:focus-visible {
    outline: 2px solid var(--outline-color);
  }
  
  &:active {
    background: #f2f2f2;
  }

  &:focus {
    outline: 2px solid var(--outline-color);
  }
`;

export const transparentButtonStyle = css`
  & {
    background: transparent;
    color: white;
  }
  
  &:hover {
    text-decoration: underline;
  }
  
  &:focus-visible {
    outline: 2px solid var(--outline-color);
  }
`;

export function Button ({
  children,
  padding = '10px',
  style,
  refProp,
  ...props
}) {
  const buttonStyle = css`
    & {
      border: none;
      outline: none;
      box-sizing: border-box;
      user-select: none;
      cursor: pointer;

      border-radius: 4px;
      padding: ${padding};
      font-size: 14px;

      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      
      transition: background 0.1s ease-out;
    }
  `;

  return (
    <button css={[buttonStyle, style]} {...props} ref={refProp}>{children}</button>
  );
}
