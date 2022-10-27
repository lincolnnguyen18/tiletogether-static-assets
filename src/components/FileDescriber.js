/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';
import { useRef } from 'react';
import { IconButtonLabel } from './IconButtonLabel';

const fileDescriberStyle = css`
  padding: 0 20px 8px 90px;
  display: flex;
`;

const divider = css`
  border-top: 3px solid #bbb;
`;

const icons = css`
  display: inline;
  float: right;
`;

const likeButtonStyle = css`
  color: white;
  float: right;
  margin-right: 16px;
  transition: color 0.1s ease-in-out;
  padding-top: 3px;

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
    color: var(--like-color);
    transition: color 0.04s ease-in-out;
  }
`;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function FileDescriber ({ authorUserName, filename, views, publisDate, likes, description, tags, type, dimension, liked }) {
  const likeButtonRef = useRef(null);
  const downloadButtonRef = useRef(null);
  const importButtonRef = useRef(null);
  const userButtonRef = useRef(null);

  return (
    <div css={fileDescriberStyle}>
      <h3>{filename}</h3>
      <div>
        <label htmlFor={_.uniqueId('fileviewdate-')}>
          {`${views} views &#x2022 ${months[publisDate.getMonth()]} ${publisDate.getDate()}, ${publisDate.getFullYear()}`}
        </label>
        <div css={icons}>
          <IconButtonLabel
            size={42}
            style={likeButtonStyle}
            refProp={likeButtonRef}
            focusColor={null}
            label={likes}
          >
            {liked
              ? <span className='icon-like-filled' />
              : <span className='icon-like-unfilled' />
            }
          </IconButtonLabel>
          <IconButtonLabel size={42} refProp={downloadButtonRef} label='Download'>
            <span className='icon-download' />
          </IconButtonLabel>
          <IconButtonLabel size={42} refProp={importButtonRef} label='Import Into Map'>
            <span className='icon-file' />
          </IconButtonLabel>
        </div>
        <hr css={divider}/>
        <p>{description}</p>
        <div style={{ display: 'inline' }}>
            {tags.map(t => <a href="url" key={_.uniqueId('filetag-')}>{t}</a>)}
        </div>
        <label htmlFor={_.uniqueId('typesize-')}>
          {`${type} &#x2022 ${dimension * dimension} pixel tiles`}
        </label>
        <IconButtonLabel size={42} refProp={userButtonRef} label={authorUserName}>
          <span className='icon-avatar' />
        </IconButtonLabel>
        <hr css={divider}/>
      </div>
    </div>
  );
}
