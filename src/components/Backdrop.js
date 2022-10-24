/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const backdropStyle = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0);
  pointer-events: none;
`;

const backdropOpenStyle = css`
  background: rgba(0, 0, 0, 0.5);
  pointer-events: all;
`;

export function Backdrop ({ children, onClose, open, transitionDuration = 0.3, style }) {
  const modifiableBackdropStyle = css`
    transition: background ${transitionDuration}s ease;
  `;

  return (
    <div
      css={[backdropStyle, modifiableBackdropStyle, open && backdropOpenStyle, style]}
      onClick={onClose}
    >
      {children}
    </div>
  );
}
