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
import { getFiles, getMoreFiles } from '../File/fileSlice';
import { Button, transparentButtonStyle } from '../../components/Button';

const gridStyle = css`
  padding: 0 20px 8px 20px;
  max-width: 2200px;
  margin: 0 auto;
`;

const dashboardStyle = css`
  height: calc(100% - var(--navbar-height));
  width: 100%;
`;

const loadMoreContainerStyle = css`
  display: flex;
  justify-content: center;
  padding: 20px 0;
`;

const loadMoreButtonStyle = css`
  & {
    text-decoration: none !important;
    gap: 8px;
  }
  
  &:hover {
    .text {
      text-decoration: underline;
    }
  }
  
  .icon-more {
    font-size: 24px;
  }
`;

export function getQueryParams (location) {
  let params = Object.fromEntries(new URLSearchParams(location.search));
  params = _.mapKeys(params, (__, key) => _.camelCase(key));
  let mode;
  switch (location.pathname) {
    case '/likes':
      mode = 'likes';
      break;
    case '/your-files':
      mode = 'your_files';
      break;
    case '/shared-files':
      mode = 'shared';
      break;
    default:
      break;
  }
  if (mode) {
    params.mode = mode;
  }
  return params;
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
  const fileSlice = useSelector((state) => state.file);
  const currentPage = useSelector((state) => state.dashboard.primitives.currentPage);
  const files = fileSlice.files;
  const pending = fileSlice.pending;

  useEffect(() => {
    dispatch(setDashboardPrimitives({ sidebarOpen: false }));
    dispatch(setModalPrimitives({ open: false }));

    try {
      const page = getCurrentPage(location, dispatch);
      dispatch(setDashboardPrimitives({
        currentPage: page,
        currentSearchKeywords: queryParams.keywords ?? '',
      }));

      document.getElementById('root').scrollTo(0, 0);
    } catch (error) {
      navigate('/');
    }

    dispatch(getFiles(getQueryParams(location, dispatch)));
  }, [location]);

  useEffect(() => {
    dispatch(getFiles(getQueryParams(location, dispatch)));
  }, []);

  let content;

  if (userSlice.primitives.user || currentPage === 'home') {
    if (files != null) {
      content = (
        <Fragment>
          <Grid itemWidth={400} gap={8} style={gridStyle}>
            {files.map((file, index) => (
              <File
                key={index}
                imageUrl='/mock-data/file-image.png'
                title={file.name}
                subtext={file.authorUsername}
                liked={userSlice.primitives.user && file.likes && file.likes.find(like => like.username === userSlice.primitives.user.username) != null}
                id={file._id}
                type={file.type}
              />
            ))
            }
          </Grid>
          {fileSlice.lastFile != null && (
            <div css={loadMoreContainerStyle}>
              <Button
                style={[transparentButtonStyle, loadMoreButtonStyle]}
                onClick={() => {
                  const payload = getQueryParams(location, dispatch);
                  payload.continuation_token = JSON.stringify(fileSlice.lastFile);
                  dispatch(getMoreFiles(payload));
                }}
              >
                <span className='text'>{pending.includes('getMoreFiles') ? 'Loading...' : 'Load More'}</span>
                <span className='icon-more' />
              </Button>
            </div>
          )}
        </Fragment>
      );
    } else {
      content = (
        <Grid itemWidth={400} gap={8} style={gridStyle}>
          {_.times(10, (i) => (
           <File key={i} isLoading={true} />
          ))}
        </Grid>
      );
    }
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
