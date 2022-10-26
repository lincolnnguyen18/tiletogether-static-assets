/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setMenu, setMenuChildren } from './menuSlice';
import { Backdrop } from '../Backdrop';
import { TabbableItems } from '../inputs/TabbableItems';
import { useEffect, useRef } from 'react';

export const menuItemStyle = css`
  & {
    width: 100%;
    outline: none;
    border: none;
    background: none;
    height: 50px;
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 0 !important;
  }
  
  & button {
    border-radius: 0 !important;
  }

  &:hover, &:focus {
    background: var(--menu-hover-color);
  }
  
  &:active {
    background: var(--menu-active-color);
  }
`;

export function openMenu (dispatch, pos, children) {
  dispatch(setMenuChildren(children));
  setTimeout(() => {
    dispatch(setMenu({ open: true, pos }));
  }, 30);
}

export function Menu () {
  const dispatch = useDispatch();
  const menuSlice = useSelector((state) => state.menu);
  const menu = menuSlice.menu;
  const menuRef = useRef(null);

  const menuStyle = css`
    background: white;
    color: black;
    width: 200px;
    position: absolute;
    left: ${menu.pos.x}px;
    top: ${menu.pos.y}px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    overflow: hidden;
    padding: 7px 0;
    opacity: 0;
    transform: scale(0.97) translateY(-5%);
    transition: opacity 0.1s ease-out, transform 0.2s ease-out;
  `;

  useEffect(() => {
    if (menu.open) {
      setTimeout(() => {
        menuRef.current.style.opacity = 1;
        menuRef.current.style.transform = 'scale(1) translateY(0)';
      }, 3);
    }
  }, [menu.open]);

  return (
    createPortal(
      <Backdrop
        onClose={() => dispatch(setMenu({ open: false }))}
        open={menu.open}
        transitionDuration={0.1}
        style={css`background: none;`}
      >
        <TabbableItems
          open={menu.open}
          onClose={() => dispatch(setMenu({ open: false }))}
        >
          {menu.open && <div css={menuStyle} ref={menuRef}>
            {menu.open && menuSlice.children}
          </div>}
        </TabbableItems>
      </Backdrop>,
      document.getElementById('portal-root'),
    )
  );
}
