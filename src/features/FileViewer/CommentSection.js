/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { FlexRow } from '../../components/Layouts/FlexRow';
import { FlexColumn } from '../../components/Layouts/FlexColumn';
import { timeUtils } from '../../utils/timeUtils';
import { useRef, useState } from 'react';
import { postComment } from './FileViewerSlice';
import { Button, IconButtonStyle, likeButtonStyle, whiteButtonStyle, blackButtonStyle } from '../../components/inputs/Button';

// eslint-disable-next-line no-unused-vars
export function CommentSection ({ authorUserName, initialComments, fileId }) {
  const userButtonRef = useRef(null);
  const likeButtonRef = useRef(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(initialComments || []);
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
    const newComment = await postComment({
      content: comment,
      fileId,
    });
    console.log(newComment.comment);
    const newComments = comments.concat(newComment.comment);
    setComments(newComments);
  };
  return (
    <FlexColumn>
      <FlexRow>
        <div css={[verticalSectionStyle, { marginRight: '10px' }]}>
          {comments ? comments.length : 0} Comments
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
      <FlexColumn>
        {comments && comments.map((c, i) =>
          <FlexColumn
            css={{ color: 'white' }}
            key={i}
          >
            <FlexRow>
              <span
                className='icon-avatar'
                css={{ fontSize: '42px' }}
              />
              <div>
                <span css={{ marginRight: '10px' }}>{c.username}</span>
                <span>{timeUtils.timeAgo(new Date(c.createdAt)) + ' ago'}</span>
              </div>
            </FlexRow>
            <div>
              {c.content}
            </div>
            <FlexRow>
              <button
                css={[IconButtonStyle, likeButtonStyle, { marginLeft: '0px' }]}
                ref={likeButtonRef}
              >
                <span>{10}</span>
                <span
                  className='icon-like-unfilled'
                  css={{ fontSize: '42px' }}
                />
              </button>
              <div css={{ fontWeight: 'bold' }}>Reply</div>
            </FlexRow>
            <div css={{ color: '#4894f9' }}>{'View 278 Replies'}</div>
          </FlexColumn>,
        )}
      </FlexColumn>
    </FlexColumn>
  );
}
