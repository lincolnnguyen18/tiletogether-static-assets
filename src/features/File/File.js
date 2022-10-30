/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Badge } from '../../components/Badge';
import { IconButton } from '../../components/inputs/IconButton';
import { Link, useLocation } from 'react-router-dom';
import { useRef } from 'react';

const fileStyle = css`
  width: 100%;
  aspect-ratio: 270 / 170;
  background: var(--file-background);
  position: relative;
`;

const imageStyle = css`
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: -o-crisp-edges;
  image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor;
  margin: 8px;
  user-select: none;
`;

const fileInfoContainerStyle = css`
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  color: white;
  opacity: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
  transition: opacity 0.2s ease-in-out;

  &:hover {
    opacity: 1;
  }
`;

const fileInfoStyle = css`
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const leftSideStyle = css`
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 8px;
`;

export function File ({ imageUrl, title, subtext, liked, type, id, isLoading = false, maxNameWidth = 300 }) {
  const likeButtonRef = useRef(null);
  const location = useLocation();
  const path = location.pathname;

  const fileInfoTextStyle = css`
  display: inline-block;
  
  // limit to one line with ellipsis for text overflow
  h1 {
    white-space: nowrap;
    max-width: ${maxNameWidth}px;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 10px;
  }
`;

  let link;

  if (path === '/your-files') {
    link = `/${type}s/${id}/edit`;
  } else {
    link = `/${type}s/${id}`;
  }

  let file;

  if (!isLoading) {
    file = (
      <div css={fileStyle}>
        <img src={imageUrl} css={imageStyle} />
        <div css={fileInfoContainerStyle}>
          <div css={fileInfoStyle}>
            <div css={leftSideStyle}>
              <Badge
                size={48}
                color='white'
                backgroundColor={`var(--${type}-color)`}
              >
                <span className={`icon-${type}`}></span>
              </Badge>
              <div css={fileInfoTextStyle}>
                <Link to={link}>
                  <h1 title={title}>{title}</h1>
                </Link>
                <span>{subtext}</span>
              </div>
            </div>
            <IconButton
              size={42}
              style={likeButtonStyle}
              refProp={likeButtonRef}
              focusColor={null}
            >
              {liked
                ? <span className='icon-like-filled' />
                : <span className='icon-like-unfilled' />
              }
            </IconButton>
          </div>
        </div>
      </div>
    );
  } else {
    file = (
      <div css={fileStyle}>
        <div css={css`padding: 8px; padding-bottom: 11px; width: 100%; height: 100%;`}>
        </div>
      </div>
    );
  }

  return file;
}
