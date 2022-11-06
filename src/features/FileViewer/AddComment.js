/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { FlexRow } from '../../components/Layouts/FlexRow';
import { FlexColumn } from '../../components/Layouts/FlexColumn';
import { useRef, useState } from 'react';
import { postComment } from './FileViewerSlice';
import { Button, IconButtonStyle, whiteButtonStyle, blackButtonStyle } from '../../components/inputs/Button';
import { useDispatch } from 'react-redux';
import { localAddComment } from '../File/fileSlice';

// eslint-disable-next-line no-unused-vars
export function AddComment ({ comments, fileId }) {
  const dispatch = useDispatch();
  const userButtonRef = useRef(null);
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
    const res = await postComment({
      content: comment,
      fileId,
    });
    if (res.status === 200) {
      dispatch(localAddComment(res.data.comment));
    }
  };
  return (
    <FlexColumn>
      <FlexRow>
        <div css={[verticalSectionStyle, { marginRight: '10px' }]}>
          {comments.length} Comments
        </div>
        <div css={verticalSectionStyle}>
          Sort By
        </div>
      </FlexRow>
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
              placeholder='Add comment ...'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <FlexRow style={{ marginRight: 'auto' }}>
              <Button css={[blackButtonStyle, { marginRight: '10px' }]} onClick={() => { setComment(''); }}>
                Cancel</Button>
              <Button css={whiteButtonStyle} onClick={handleCommentSubmit}>Comment</Button>
            </FlexRow>
          </FlexRow>
        </div>
      </FlexRow>
      <hr color='gray'/>
    </FlexColumn>
  );
}
