/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';
import { useRef } from 'react';
import { FlexRow } from './FlexRow';
import { IconButtonLabel } from './IconButtonLabel';

const fileDescriberStyle = css`
  display: flex;
  flex-direction: column;
`;

const divider = css`
  border-top: 0.5px solid #bbb;
`;

const verticalSection = css`
  color: white;
  padding: 10px 0 0 0;
`;

const likeButtonStyle = css`
  color: white;
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

export function FileDescriber ({ authorUserName, filename, views, publisDate, likes, description, tagStr, type, dimension, liked }) {
  const likeButtonRef = useRef(null);
  const downloadButtonRef = useRef(null);
  const importButtonRef = useRef(null);
  const userButtonRef = useRef(null);

  const date = new Date(publisDate);
  const tags = tagStr.split(' ');

  return (
    <div css={fileDescriberStyle}>
      <h1 css={verticalSection}>{filename}</h1>
      <FlexRow>
        <label css={css`color: white;`}>
          {`${views} views`} <span>&#x2022;</span> {`${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`}
        </label>
        <FlexRow style={css`margin-left: auto;`}>
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
        </FlexRow>
      </FlexRow>
      <hr css={divider}/>
      <p css={verticalSection}>{description}</p>
      <FlexRow style={verticalSection}>
        {tags.map(t => <a css={css`color: #4894F9; margin-right: 10px;`} href="badurl" key={_.uniqueId('filetag-')}>#{t}</a>)}
      </FlexRow>
      <label css={verticalSection}>{`${type}`} <span>&#x2022;</span> {`${dimension * dimension} pixel tiles`}</label>
      <IconButtonLabel size={42} refProp={userButtonRef} label={authorUserName} extraStyle={verticalSection}>
        <span className='icon-avatar' />
      </IconButtonLabel>
      <hr css={divider}/>
    </div>
  );
}
