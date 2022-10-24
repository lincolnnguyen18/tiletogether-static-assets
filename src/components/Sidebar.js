/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { createPortal } from 'react-dom';
import { Backdrop } from './Backdrop';
import { useEffect } from 'react';

const sidebarStyle = css`
  & {
    background: var(--gray);
    color: white;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    opacity: 1;
    transform: translateX(-100%);
    transition: transform 0.15s ease;
  }
`;

const sidebarOpenStyle = css`
  & {
    transform: translateX(0);
  }
`;

function onSidebarClick (e) {
  e.stopPropagation();
}

export function Sidebar ({ children, open, onClose, style }) {
  function handleKeyDown (e) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    createPortal(
      <Backdrop onClose={onClose} open={open}>
        <div
          css={[sidebarStyle, open && sidebarOpenStyle, style]}
          onClick={onSidebarClick}
        >
          {children}
        </div>
      </Backdrop>,
      document.getElementById('portal-root'),
    )
  );
}
