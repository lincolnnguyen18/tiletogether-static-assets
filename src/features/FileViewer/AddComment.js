/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { FlexRow } from '../../components/layout/FlexRow';
import { FlexColumn } from '../../components/layout/FlexColumn';
import { useRef, useState, Fragment } from 'react';
import { selectUser } from '../User/userSlice';
import { Button, IconButtonStyle, whiteButtonStyle, blackButtonStyle, transparentButtonStyle } from '../../components/inputs/Button';
import { menuItemStyle, openMenu } from '../../components/Menu/Menu';
import { useDispatch, useSelector } from 'react-redux';
import { openAuthModal } from '../Dashboard/Modals/AuthModal';
import { asyncPostComment, sortComments } from '../File/fileSlice';

export function AddComment ({ parentId, setReplying }) {
  const dispatch = useDispatch();
  const userButtonRef = useRef(null);
  const fileSlice = useSelector((state) => state.file);
  const comments = fileSlice.file.comments;
  const user = useSelector(selectUser);
  const fileId = fileSlice.file.id || fileSlice.file._id;
  const menuSlice = useSelector((state) => state.menu);
  const menu = menuSlice.menu;
  const [comment, setComment] = useState('');
  const sortButtonRef = useRef(null);
  const verticalSectionStyle = css`
    color: white;
    padding: 10px 0 0 0;
  `;

  const commentInputStyle = css`
    & {
      width: 100%;
    }
    
    input {
      padding: 10px;
      margin-right: 10px;
      border-radius: 4px;
      width: 100%;
    }
  `;

  const sortByStyle = css`
     margin-top: 10px;

  `;

  const sortMenuItemStyle = css`
    gap: 8px;
    padding-left: 10px;
  `;

  const handleCommentSubmit = async () => {
    if (user) {
      dispatch(asyncPostComment({ content: comment, fileId, parentId }));
      setComment('');
    } else {
      openAuthModal(dispatch, 'login');
    }
  };

  const sortButtons = [
    {
      onClick: () => handleSortComments('date'),
      text: 'Date',
    },
    {
      onClick: () => handleSortComments('likes'),
      text: 'Likes',
    },
  ];

  const openSortModal = () => {
    const rect = sortButtonRef.current.getBoundingClientRect();
    const pos = {
      x: menu.width - 76,
      y: rect.y + rect.height + 8,
    };
    openMenu(dispatch, pos, (
      <Fragment>
        {sortButtons.map((button, index) => (
          <button
            css={[menuItemStyle, sortMenuItemStyle]}
            onClick={button.onClick}
            key={index}
            autoFocus={index === 0}
          >
            <span>{button.text}</span>
          </button>
        ))}
      </Fragment>
    ));
  };

  const handleSortComments = async (type) => {
    // console.log(type);
    dispatch(sortComments({ type }));
  };

  return (
    <FlexColumn>
      { !parentId &&
        <FlexRow> <div css={[verticalSectionStyle, { marginRight: '10px' }]}>
          {comments.length} Comments
        </div>
        <Button refProp={sortButtonRef}
          style={transparentButtonStyle} css={sortByStyle} onClick={openSortModal}>
            Sort By
        </Button>
        </FlexRow>
      }
      <FlexRow style={{ width: '100%' }}>
        <div
          css={[IconButtonStyle, verticalSectionStyle, { marginLeft: '0px', width: '100%' }]}
          ref={userButtonRef}
        >
          <FlexRow style={commentInputStyle}>
            <span
              className='icon-avatar'
              css={{ fontSize: '60px' }}
            />
            <input
              name='content'
              placeholder={parentId ? 'Add a reply' : 'Add comment ...'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <FlexRow style={{ marginRight: 'auto' }}>
              <Button css={[blackButtonStyle, { marginRight: '10px' }]} onClick={() => { setComment(''); setReplying(false); }}>
                Cancel</Button>
              <Button css={whiteButtonStyle} onClick={handleCommentSubmit}>{parentId ? 'Reply' : 'Comment'}</Button>
            </FlexRow>
          </FlexRow>
        </div>
      </FlexRow>
      {!parentId && <hr color='gray'/>}
    </FlexColumn>
  );
}
