/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { LogoButton } from './LogoButton';
import { useDispatch, useSelector } from 'react-redux';
import { Fragment } from 'react';
import { IconButton } from '../../../components/inputs/IconButton';
import { NavSidebar } from './NavSidebar';
import { setDashboardPrimitives } from '../dashboardSlice';
import { RightSection } from './RightSection';
import { MiddleSection } from './MiddleSection';

const navbarStyle = css`
  display: flex;
  gap: var(--gap);
  align-items: center;
  justify-content: space-between;
  color: var(--off-white);
  padding: 0 16px;
  height: var(--navbar-height);
  width: 100%;
  background: rgb(44, 44, 44, 0.98);
  backdrop-filter: blur(10px);
  box-sizing: border-box;

  position: sticky;
  z-index: 1;
  top: 0;
  left: 0;

  div {
    display: flex;
    align-items: center;
  }
`;

const leftSectionStyle = css`
  gap: 16px;
`;

export function Navbar () {
  const dispatch = useDispatch();
  const dashboardSlice = useSelector((state) => state.dashboard);
  const sidebarOpen = dashboardSlice.primitives.sidebarOpen;

  const leftSection = (
    <div css={leftSectionStyle}>
      <IconButton
        onClick={() => dispatch(setDashboardPrimitives({ sidebarOpen: true }))}
      >
        <span className='icon-menu'></span>
      </IconButton>
      <LogoButton />
    </div>
  );

  return (
    <Fragment>
      <NavSidebar
        open={sidebarOpen}
        onClose={() => dispatch(setDashboardPrimitives({ sidebarOpen: false }))}
      />
      <div css={navbarStyle}>
        {leftSection}
        <MiddleSection />
        <RightSection />
      </div>
    </Fragment>
  );
}
