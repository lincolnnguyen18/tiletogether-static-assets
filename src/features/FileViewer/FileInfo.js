/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';
import { useRef } from 'react';
import { FlexRow } from '../../components/layout/FlexRow';
import { FlexColumn } from '../../components/layout/FlexColumn';
import { IconButtonStyle, likeButtonStyle } from '../../components/inputs/Button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { asyncLikeFile, setFileLike } from '../File/fileSlice';
import { selectUser } from '../User/userSlice';

const verticalSectionStyle = css`
  color: white;
  padding: 10px 0 0 0;
`;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function likeFile ({ dispatch, id, liked, username }) {
  dispatch(asyncLikeFile({ id, liked: !liked }));
  dispatch(setFileLike({ liked: !liked, username, fileId: id }));
}

export function FileInfo () {
  const dispatch = useDispatch();
  const { id } = useParams();
  const fileSlice = useSelector((state) => state.file);
  const file = fileSlice.file;
  const likeButtonRef = useRef(null);
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const date = new Date(file.publishedAt);
  const tags = file.tags ? file.tags.split(' ') : [];
  const isMap = file.type === 'map';

  const liked = user && file.likes.some(l => l.username === user.username);
  const likes = file.likeCount;

  function handleLikeSubmit () {
    likeFile({
      dispatch,
      id,
      liked,
      username: user.username,
    });
  }

  function handleEdit () {
    navigate(`/${file.type}s/${id}/edit`);
  }

  return (
    <FlexColumn>
      <h1 css={verticalSectionStyle}>{file.name}</h1>
      <FlexRow>
        <label css={{ color: 'white' }}>
          {`${file.views} views`} <span>&#x2022;</span> {`${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`}
        </label>
        <FlexRow style={{ marginLeft: 'auto' }}>
          <button css={[IconButtonStyle, likeButtonStyle]} ref={likeButtonRef} onClick={handleLikeSubmit}>
            {liked
              ? <span className='icon-like-filled' css={{ fontSize: '42px' }}/>
              : <span className='icon-like-unfilled' css={{ fontSize: '42px' }}/>
            }
            <span>{likes}</span>
          </button>
          <button css={IconButtonStyle}>
            <span className='icon-download' css={{ fontSize: '40px' }}/>
            <span>Download</span>
          </button>
          {user && file.authorUsername === user.username && (
            <button css={IconButtonStyle} onClick={handleEdit}>
              <span className='icon-pencil' css={{ fontSize: '38px' }}/>
              <span>Edit</span>
            </button>
          )}
          <button css={IconButtonStyle}>
            <span className='icon-file' css={{ fontSize: '42px' }}/>
            <span>Import Into Map</span>
          </button>
        </FlexRow>
      </FlexRow>
      <hr color='gray'/>
      <p css={verticalSectionStyle}>{file.description}</p>
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
        {`${file.type}`} <span>&#x2022;</span> {`${file.tileDimension} pixel tiles`} {isMap && <span>&#x2022;</span>} { isMap && `${file.width} x ${file.height} map`}
      </label>
      <FlexRow>
        <button css={[IconButtonStyle, { marginLeft: '0px' }]}>
          <span className='icon-avatar' css={{ fontSize: '42px' }}/>
          <span>{file.authorUsername}</span>
        </button>
      </FlexRow>
      <hr color='gray'/>
    </FlexColumn>
  );
}
