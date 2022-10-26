/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { IconButton } from '../../../components/inputs/IconButton';
import { LogoButton } from './LogoButton';
import { Sidebar } from '../../../components/Sidebar';
import { Icon } from '../../../components/Icon';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { TabbableItems } from '../../../components/inputs/TabbableItems';
import { pages } from '../Dashboard';
import { useSelector } from 'react-redux';

const navSidebarStyle = css`
  width: 270px;
`;

const headerStyle = css`
  padding-left: 16px;
  display: flex;
  align-items: center;
  height: var(--navbar-height);
  gap: 16px;
`;

const itemStyle = css`
  & {
    height: 42px;
    cursor: pointer;
    padding-left: 16px;
    background: none;
    border: none;
    color: white;
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  &.selected {
    background: var(--selected-sidebar-item);
  }

  &:not(.selected):hover {
    background: var(--hover-sidebar-item);
  }

  &.selected:hover {
    background: var(--hover-selected-sidebar-item);
  }

  &:not(.selected):active, &.selected:active {
    background: var(--active-sidebar-item);
    transition: background 0.07s ease;
  }

  &:focus {
    outline: none;
    box-shadow: none;
    background: var(--hover-sidebar-item);
  }
`;

export function NavSidebar ({ open, onClose }) {
  const navigate = useNavigate();
  const currentItemRef = useRef(null);
  const currentPage = useSelector((state) => state.dashboard.primitives.currentPage);

  function onItemClick (page) {
    onClose();
    if (page === 'home') {
      navigate('/');
    } else {
      navigate(`/${page}`);
    }
  }

  useEffect(() => {
    if (open && currentItemRef.current) {
      currentItemRef.current.focus();
    }
  }, [open]);

  return (
    <Sidebar
      open={open}
      onClose={onClose}
      style={navSidebarStyle}
    >
      <div css={headerStyle}>
        <IconButton onClick={onClose}>
          <span className='icon-menu'></span>
        </IconButton>
        <LogoButton />
      </div>
      <div css={css`button { border-radius: 0 !important; }`}>
        <TabbableItems open={open} onClose={onClose}>
          {Object.keys(pages).map((page, index) => {
            const title = pages[page].title;
            const icon = pages[page].icon;

            return (
              <button
                key={index}
                ref={currentPage === page ? currentItemRef : null}
                css={[itemStyle]}
                className={currentPage === page ? 'selected' : ''}
                onClick={() => onItemClick(page)}
              >
                <Icon>
                  <span className={icon}></span>
                </Icon>
                <span>{title}</span>
              </button>
            );
          })}
        </TabbableItems>
      </div>
    </Sidebar>
  );
}
