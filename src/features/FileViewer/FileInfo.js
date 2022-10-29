/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';
import { useRef } from 'react';
import { FlexRow } from '../../components/Layouts/FlexRow';
import { FlexColumn } from '../../components/Layouts/FlexColumn';

const verticalSectionStyle = css`
  color: white;
  padding: 10px 0 0 0;
`;

const buttonStyle = css`
  padding-top: 3px;
  margin-left: 24px;

  display: flex;
  justify-content: center;
  align-items: center;

  color: white;
  transition: color 0.1s ease-in-out;
  border: none;
  background: none;
  background-color: Transparent;
  background-repeat:no-repeat;

  @keyframes fade-in-out {
    0% {
      background-color: rgba(255, 255, 255, 0);
    }
    50% {
      background-color: rgba(255, 255, 255, 0.3);
    }
    100% {
      background-color: rgba(255, 255, 255, 0);
    }
  }

  &:active {
    color: gray;
    transition: color 0.04s ease-in-out;
  }
`;

const likeButtonStyle = css`
  &:active {
    color: var(--like-color);
    transition: color 0.04s ease-in-out;
  }
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
          <button css={[buttonStyle, likeButtonStyle]} ref={likeButtonRef}>
            {liked
              ? <span className='icon-like-filled' css={{ fontSize: '42px' }}/>
              : <span className='icon-like-unfilled' css={{ fontSize: '42px' }}/>
            }
            <span>{likes}</span>
          </button>
          <button css={buttonStyle} ref={downloadButtonRef}>
            <span className='icon-download' css={{ fontSize: '42px' }}/>
            <span>Download</span>
          </button>
          <button css={buttonStyle} ref={importButtonRef}>
            <span className='icon-file' css={{ fontSize: '42px' }}/>
            <span>Import Into Map</span>
          </button>
        </FlexRow>
      </FlexRow>
      <hr color='gray'/>
      <p css={verticalSectionStyle}>{description}</p>
      <FlexRow style={verticalSectionStyle}>
        {tags.map(t => <a css={{ color: '#4894F9', marginRight: '10px' }} href="badurl" key={_.uniqueId('filetag-')}>#{t}</a>)}
      </FlexRow>
      <label css={verticalSectionStyle}>
        {`${type}`} <span>&#x2022;</span> {`${dimension * dimension} pixel tiles`} {isMap && <span>&#x2022;</span>} { isMap && `${width} X ${height} map`}
      </label>
      <FlexRow>
        <button css={[buttonStyle, { marginLeft: '0px' }]} ref={userButtonRef}>
          <span className='icon-avatar' css={{ fontSize: '42px' }}/>
          <span>{authorUserName}</span>
        </button>
      </FlexRow>
      <hr color='gray'/>
    </FlexColumn>
  );
}
