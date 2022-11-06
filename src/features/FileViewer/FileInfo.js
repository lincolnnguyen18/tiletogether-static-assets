/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';
import { useRef } from 'react';
import { FlexRow } from '../../components/Layouts/FlexRow';
import { FlexColumn } from '../../components/Layouts/FlexColumn';
import { IconButtonStyle, likeButtonStyle } from '../../components/inputs/Button';
import { Link } from 'react-router-dom';

const verticalSectionStyle = css`
  color: white;
  padding: 10px 0 0 0;
`;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function FileInfo ({ authorUserName, filename, description, type, dimension, width, height, publishDate, views, likes, liked, tagStr }) {
  const likeButtonRef = useRef(null);
  const downloadButtonRef = useRef(null);
  const importButtonRef = useRef(null);
  const userButtonRef = useRef(null);

  const date = new Date(publishDate);
  const tags = tagStr.split(' ');
  const isMap = type === 'map';

  return (
    <FlexColumn>
      <h1 css={verticalSectionStyle}>{filename}</h1>
      <FlexRow>
        <label css={{ color: 'white' }}>
          {`${views} views`} <span>&#x2022;</span> {`${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`}
        </label>
        <FlexRow style={{ marginLeft: 'auto' }}>
          <button css={[IconButtonStyle, likeButtonStyle]} ref={likeButtonRef}>
            {liked
              ? <span className='icon-like-filled' css={{ fontSize: '42px' }}/>
              : <span className='icon-like-unfilled' css={{ fontSize: '42px' }}/>
            }
            <span>{likes}</span>
          </button>
          <button css={IconButtonStyle} ref={downloadButtonRef}>
            <span className='icon-download' css={{ fontSize: '42px' }}/>
            <span>Download</span>
          </button>
          <button css={IconButtonStyle} ref={importButtonRef}>
            <span className='icon-file' css={{ fontSize: '42px' }}/>
            <span>Import Into Map</span>
          </button>
        </FlexRow>
      </FlexRow>
      <hr color='gray'/>
      <p css={verticalSectionStyle}>{description}</p>
      <FlexRow style={verticalSectionStyle} gap={10}>
        {tags.map(t => (
          <Link
            key={_.uniqueId('filetag-')}
            to={`/search?keywords=${t}`}
            style={{ color: '#4894f9', textDecoration: 'none' }}
          >#{t}</Link>
        ))}
      </FlexRow>
      <label css={verticalSectionStyle}>
        {`${type}`} <span>&#x2022;</span> {`${dimension} pixel tiles`} {isMap && <span>&#x2022;</span>} { isMap && `${width} x ${height} map`}
      </label>
      <FlexRow>
        <button css={[IconButtonStyle, { marginLeft: '0px' }]} ref={userButtonRef}>
          <span className='icon-avatar' css={{ fontSize: '42px' }}/>
          <span>{authorUserName}</span>
        </button>
      </FlexRow>
      <hr color='gray'/>
    </FlexColumn>
  );
}
