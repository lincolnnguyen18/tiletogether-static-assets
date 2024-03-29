import { Searchbar } from './Searchbar';
import { setDashboardPrimitives } from '../dashboardSlice';
import { IconButton } from '../../../components/inputs/IconButton';
/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../../components/Icon';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setModalPrimitives, setModalReactElements } from '../../../components/Modal/modalSlice';
import { SearchOptionsModalBody, SearchOptionsModalHeader } from '../Modals/SearchOptionsModal';
import { getQueryParams, pages } from '../Dashboard';
import { useEffect } from 'react';
import _ from 'lodash';

const middleSectionStyle = css`
  gap: var(--gap);
  width: 100%;
  max-width: 700px;
  justify-content: center;
`;

const pageIndicatorStyle = css`
  display: flex;
  gap: 4px;
  align-items: center;
  color: white;
  background: none;
  border: none;
  padding-left: 12px;
  flex-shrink: 0;
  cursor: pointer;
`;

export function submitSearch (navigate, location, oldOptions, newOptions) {
  const searchOptions = Object.assign({}, oldOptions, newOptions);

  const validPathNames = ['likes', 'your-files', 'shared-files', 'users'];
  let newRoute;
  const path = location.pathname.split('/')[1];
  if (!validPathNames.includes(path)) {
    newRoute = '/search?';
  } else {
    newRoute = location.pathname + '?';
  }

  // remove mode key from searchOptions since it is inferred from the pathname, mode is only added before the request is made (this is done in getQueryParams)
  delete searchOptions.mode;
  const paramString = Object.keys(searchOptions)
    .filter(key => searchOptions[key] !== '')
    .map((key) => `${_.snakeCase(key)}=${searchOptions[key]}`)
    .join('&');
  navigate(newRoute + paramString);
}

export function MiddleSection () {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardSlice = useSelector((state) => state.dashboard);
  const currentPage = useSelector((state) => state.dashboard.primitives.currentPage);
  const searchOptions = getQueryParams(location);
  const authorUsername = dashboardSlice.primitives.authorUsername;

  let pageIndicator;
  if (currentPage !== 'home') {
    let page = pages[currentPage];

    if (currentPage === 'users') {
      page = {
        title: `${authorUsername}'s files`,
        icon: 'icon-file',
      };
    }

    pageIndicator = (
      <button
        css={pageIndicatorStyle}
        onClick={() => {
          if (currentPage === 'users') {
            navigate(`/users/${authorUsername}`);
          } else {
            navigate(`/${currentPage}`);
          }
        }}
      >
        <span>{page.title}</span>
        <Icon>
          <span className={page.icon}></span>
        </Icon>
      </button>
    );
  }

  function onSearchOptionsClick () {
    dispatch(setModalReactElements({
      header: <SearchOptionsModalHeader />,
      children: <SearchOptionsModalBody onSubmit={submitSearch} />,
    }));
    dispatch(setModalPrimitives({ open: true }));
  }

  function onSearchShortcut (e) {
    const searchbar = document.getElementById('searchbar');
    if (e.key === '/' && document.activeElement !== searchbar) {
      e.preventDefault();
      searchbar.focus();
    } else if (e.key === 'Escape' && searchbar === document.activeElement && searchbar.value === '') {
      searchbar.blur();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', onSearchShortcut);
    return () => document.removeEventListener('keydown', onSearchShortcut);
  }, []);

  return (
    <div css={middleSectionStyle}>
      {pageIndicator}
      <Searchbar
        placeholder={currentPage !== 'users' ? pages[currentPage].searchText : `Search ${authorUsername}'s files`}
        value={dashboardSlice.primitives.currentSearchKeywords}
        onChange={v => dispatch(setDashboardPrimitives({ currentSearchKeywords: v }))}
        onSubmit={v => submitSearch(navigate, location, searchOptions, { keywords: v })}
      />
      <IconButton
        onClick={onSearchOptionsClick}
      >
        <span className='icon-settings'></span>
      </IconButton>
    </div>
  );
}
