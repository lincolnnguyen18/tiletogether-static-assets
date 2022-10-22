/** @jsx jsx */
import { jsx } from '@emotion/react';
import { Badge } from '../../../components/Badge';
import { Icon } from '../../../components/Icon';
import { Textfield, whiteInputStyle } from '../../../components/Textfield';
import { SelectMenu } from '../../../components/SelectMenu';
import { blackButtonStyle, Button } from '../../../components/Button';
import { submitSearch } from '../Navbar/MiddleSection';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getQueryParams } from '../Dashboard';
import { modalBodyStyle, modalheaderStyle } from '../../../components/Modal/Modal';

export function SearchOptionsModalHeader () {
  return (
    <div css={modalheaderStyle}>
      <h1>Search Options</h1>
      <Badge color='white' backgroundColor='black' size={30} iconSize={24}>
        <Icon>
          <span className='icon-settings'></span>
        </Icon>
      </Badge>
    </div>
  );
}

export function SearchOptionsModalBody () {
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardSlice = useSelector((state) => state.dashboard);
  const searchOptions = getQueryParams(location);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formDataDict = Object.fromEntries(formData.entries());
        submitSearch(navigate, location, searchOptions, formDataDict);
      }}
      css={modalBodyStyle}
    >
      <Textfield
        placeholder=''
        label='Keywords'
        type='text'
        autoFocus
        style={whiteInputStyle}
        name='query'
        defaultValue={dashboardSlice.primitives.currentSearchKeywords || ''}
      />
      <Textfield
        placeholder=''
        label='Tile dimension (width and height of a tile in pixels)'
        type='number'
        style={whiteInputStyle}
        name='tiledimension'
        defaultValue={searchOptions.tiledimension ? Number(searchOptions.tiledimension) : ''}
      />
      <SelectMenu
        label='File type'
        items={{ Any: 'any', Tileset: 'tileset', Map: 'map' }}
        name='filetype'
        defaultValue={searchOptions.filetype}
      />
      <SelectMenu
        label='Sort by'
        items={{ 'Publish date': 'publishdate', 'View count': 'view-count', Likes: 'likes' }}
        name='sortby'
        defaultValue={searchOptions.sortby}
      />
      <Button style={blackButtonStyle}>
        <span>Apply</span>
      </Button>
    </form>
  );
}
