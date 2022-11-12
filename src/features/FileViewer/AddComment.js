/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { FlexRow } from '../../components/layout/FlexRow';
import { FlexColumn } from '../../components/layout/FlexColumn';
import { useRef, useState } from 'react';
import { Button, IconButtonStyle, whiteButtonStyle, blackButtonStyle } from '../../components/inputs/Button';
import { useDispatch, useSelector } from 'react-redux';
import { asyncPostComment } from '../File/fileSlice';

export function AddComment ({ parentId, setReplying }) {
  const dispatch = useDispatch();
  const userButtonRef = useRef(null);
  const fileSlice = useSelector((state) => state.file);
  const comments = fileSlice.file.comments;
  const fileId = fileSlice.file.id || fileSlice.file._id;
  const [comment, setComment] = useState('');

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

  const handleCommentSubmit = async () => {
    dispatch(asyncPostComment({ content: comment, fileId, parentId }));
    setComment('');
  };

  return (
    <FlexColumn>
      { !parentId &&
        <FlexRow> <div css={[verticalSectionStyle, { marginRight: '10px' }]}>
            {comments.length} Comments
          </div>
          <div css={verticalSectionStyle}>
            Sort By
          </div>
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
