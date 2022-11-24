/** @jsx jsx */
import { jsx } from '@emotion/react';
import { useState } from 'react';
import { AddComment } from './AddComment';
import { FlexColumn } from '../../components/layout/FlexColumn';
import { FlexRow } from '../../components/layout/FlexRow';
import { IconButtonStyle, likeButtonStyle } from '../../components/inputs/Button';
import { CommentInfo } from './CommentSection';
import { useDispatch, useSelector } from 'react-redux';
import { asyncLikeComment, setCommentLike } from '../File/fileSlice';
import { selectUser } from '../User/userSlice';

export function ReplyComment ({
  commentId, likeButtonRef, replies,
}) {
  const dispatch = useDispatch();
  const fileSlice = useSelector((state) => state.file);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const file = fileSlice.file;
  const user = useSelector(selectUser);
  const commentIdx = file.comments.findIndex(c => c._id === commentId);
  const liked = user && file.comments[commentIdx].likes.some(l => l.username === user.username);
  const likes = file.comments[commentIdx].likeCount;
  function handleLikeComment () {
    dispatch(asyncLikeComment({ id: fileSlice.file.id, commentId, liked: !liked }));
    dispatch(setCommentLike({ liked: !liked, username: user.username, fileId: file.id, commentId }));
  }
  return (
    <FlexColumn>
      <FlexRow>
        <button
          css={[IconButtonStyle, likeButtonStyle, { marginLeft: '0px' }]}
          ref={likeButtonRef}
          onClick={handleLikeComment}
        >
          <span>{likes}</span>
          {liked
            ? <span className='icon-like-filled' css={{ fontSize: '42px' }}/>
            : <span className='icon-like-unfilled' css={{ fontSize: '42px' }}/>
          }
        </button>
        <button css={[IconButtonStyle, { marginLeft: '3px' }]} onClick={() => setReplying(!replying)}>Reply</button>
      </FlexRow>
      <FlexColumn>
        {replying && <AddComment parentId={commentId} setReplying={setReplying}/>}
      </FlexColumn>
      <div onClick={() => { setShowReplies(!showReplies); }}css={{ color: '#4894f9' }}>{'View ' + replies.filter(reply => reply.parentId === commentId).length + ' replies'}</div>
      {showReplies && replies.filter(reply => reply.parentId === commentId).map((r, i) =>
        <div css={{ marginLeft: '24px' }}key={i}>
          <CommentInfo c={r}/>
        </div>)}
    </FlexColumn>

  );
}
