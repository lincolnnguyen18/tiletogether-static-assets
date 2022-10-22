import { Searchbar } from './Searchbar';
import { setDashboardPrimitives } from '../dashboardSlice';
import { IconButton } from '../../../components/IconButton';
/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from '../../../components/Icon';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setModalPrimitives, setModalReactElements } from '../../../components/Modal/modalSlice';
import { SearchOptionsModalBody, SearchOptionsModalHeader } from '../Modals/SearchOptionsModal';
import { getQueryParams, pages } from '../Dashboard';
import { useEffect } from 'react';

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

  if (!searchOptions.keywords) searchOptions.keywords = '';
  if (!searchOptions.tiledimension) searchOptions.tiledimension = '';
  if (!searchOptions.filetype) searchOptions.filetype = 'any';
  if (!searchOptions.sortby) searchOptions.sortby = 'publishdate';

  const pathname = location.pathname === '/' ? '/search' : location.pathname;
  const newRoute = pathname + '?';
  const paramString = Object.keys(searchOptions)
    .filter(key => searchOptions[key] !== '')
    .map((key) => `${key}=${searchOptions[key]}`)
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

  let pageIndicator;
  if (currentPage !== 'home') {
    const page = pages[currentPage];
    pageIndicator = (
      <button
        css={pageIndicatorStyle}
        onClick={() => {
          navigate(`/${currentPage}`);
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
        placeholder={pages[currentPage].searchText}
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
