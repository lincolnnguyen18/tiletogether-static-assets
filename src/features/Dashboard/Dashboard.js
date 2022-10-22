/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { File } from '../../components/File';
import { Grid } from '../../components/Grid';
import _ from 'lodash';
import { Fragment, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setDashboardPrimitives } from './dashboardSlice';
import { setModalPrimitives } from '../../components/Modal/modalSlice';
import { Navbar } from './Navbar/Navbar';
import { openAuthModal } from './Modals/AuthModal';
import { RedirectPage } from '../../components/RedirectPage';
import { Icon } from '../../components/Icon';

const gridStyle = css`
  padding: 0 20px 8px 20px;
  max-width: 2200px;
  margin: 0 auto;
`;

const dashboardStyle = css`
  height: calc(100% - var(--navbar-height));
  width: 100%;
`;

export function getQueryParams (location) {
  return Object.fromEntries(new URLSearchParams(location.search));
}

function getCurrentPage (location, dispatch = null) {
  let path = location.pathname;
  if (path == null || path === '/search') path = '/';
  switch (path) {
    case '/login':
    case '/register':
      openAuthModal(dispatch, path.slice(1));
      break;
    case '/':
      return 'home';
    case '/likes':
    case '/your-files':
    case '/shared-files':
      return path.slice(1);
    default:
      throw new Error('Invalid dashboard path', path);
  }
}

export function Dashboard () {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = getQueryParams(location);
  const dispatch = useDispatch();
  const userSlice = useSelector((state) => state.user);
  const currentPage = useSelector((state) => state.dashboard.primitives.currentPage);

  useEffect(() => {
    dispatch(setDashboardPrimitives({ sidebarOpen: false }));
    dispatch(setModalPrimitives({ open: false }));

    try {
      const page = getCurrentPage(location, dispatch);
      dispatch(setDashboardPrimitives({ currentPage: page }));
      document.getElementById('root').scrollTo(0, 0);

      dispatch(setDashboardPrimitives({ currentSearchKeywords: queryParams.keywords ?? '' }));
    } catch (error) {
      navigate('/');
    }
  }, [location]);

  let content;

  if (userSlice.primitives.user || currentPage === 'home') {
    content = (
      <Grid itemWidth={400} gap={8} style={gridStyle}>
        {_.times(56, (i) => (
          <File
            key={i}
            imageUrl='/mock-data/file-image.png'
            title='Basic Furniture'
            subtext='Batu Blanka · 16px tiles'
            liked={false}
          >
          </File>
        ))}
      </Grid>
    );
  } else {
    content = (
      <RedirectPage
        icon={(
          <Icon size={64} iconSize={90}>
            <span className={pages[currentPage].icon}></span>
          </Icon>
        )}
        title={pages[currentPage].redirectTitle}
        message={pages[currentPage].redirectMessage}
      />
    );
  }

  return (
    <Fragment>
      <Navbar />
      <div css={dashboardStyle}>
        {content}
      </div>
    </Fragment>
  );
}

export const pages = {
  home: {
    title: 'Home',
    icon: 'icon-home',
    searchText: 'Search all files on TileTogether',
  },
  likes: {
    title: 'Your Likes',
    icon: 'icon-like-filled',
    searchText: 'Search files you liked',
    redirectTitle: 'View your liked files',
    redirectMessage: 'Log in to access files you liked',
  },
  'your-files': {
    title: 'Your files',
    icon: 'icon-file',
    searchText: 'Search your files',
    redirectTitle: 'View your files',
    redirectMessage: 'Log in to access files you created',
  },
  'shared-files': {
    title: 'Files shared with you',
    icon: 'icon-shared-with-you',
    searchText: 'Search files shared with you',
    redirectTitle: 'View your shared files',
    redirectMessage: 'Log in to access files other users have shared with you',
  },
};
