/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { createPortal } from 'react-dom';
import { Backdrop } from '../Backdrop';
import { useDispatch, useSelector } from 'react-redux';
import { setModalPrimitives } from './modalSlice';
import { IconButton } from '../IconButton';
import { useEffect, useRef } from 'react';

export const modalheaderStyle = css`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const modalBodyStyle = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const modalStyle = css`
  background: white;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -49%) scale(0.97);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out, transform 0.1s ease-in-out;
`;

function onModalClick (e) {
  e.stopPropagation();
}

function onEscape (e) {
  if (e.key === 'Escape') {
    window.closeModal();
  }
}

export function Modal ({ style, closeOnEscape = false }) {
  const dispatch = useDispatch();
  const modalSlice = useSelector((state) => state.modal);
  const primitives = modalSlice.primitives;
  const reactElements = modalSlice.reactElements;
  const modalRef = useRef(null);

  const modifiableModalStyle = css`
    width: ${primitives.width ?? 300}px;
  `;

  const closeHeaderStyle = css`
    display: flex;
    justify-content: ${reactElements.header ? 'space-between' : 'flex-end'};
    align-items: center;
    margin-bottom: 16px;
`;

  useEffect(() => {
    if (primitives.open) {
      if (closeOnEscape) {
        document.addEventListener('keydown', onEscape);
        window.closeModal = () => dispatch(setModalPrimitives({ open: false }));
      }
      setTimeout(() => {
        modalRef.current.style.opacity = 1;
        modalRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 3);
    } else if (closeOnEscape) {
      document.removeEventListener('keydown', onEscape);
      delete window.closeModal;
    }
  }, [primitives.open]);

  return (
    createPortal(
      <Backdrop
        onClose={() => dispatch(setModalPrimitives({ open: false }))}
        open={primitives.open}
        transitionDuration={0.3}
      >
        {primitives.open && (
          <div
            css={[modalStyle, modifiableModalStyle, style]}
            onClick={onModalClick}
            ref={modalRef}
          >
            <div css={closeHeaderStyle}>
              {reactElements.header}
              <IconButton
                color='black'
                focusColor='#d3d3d3'
                style={css`padding: 2px 0 0 2px;`}
                onClick={() => dispatch(setModalPrimitives({ open: false }))}
              >
                <span className='icon-close' />
              </IconButton>
            </div>
            {reactElements.children}
          </div>
        )}
      </Backdrop>,
      document.getElementById('portal-root'),
    )
  );
}
