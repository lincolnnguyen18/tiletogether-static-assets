/** @jsx jsx */
import { jsx } from '@emotion/react';
import { FlexRow } from '../../components/layout/FlexRow';
import { FlexColumn } from '../../components/layout/FlexColumn';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { timeAgo } from '../../utils/timeUtils';
import { ReplyComment } from './ReplyComment';
import { selectUser } from '../User/userSlice';

export function CommentInfo ({ c }) {
  return (
    <FlexColumn>
      <FlexRow>
      <span
        className='icon-avatar'
        css={{ fontSize: '42px' }}
      />
        <div>
          <span css={{ marginRight: '10px' }}>{c.username}</span>
          <span>{timeAgo(new Date(c.createdAt)) + ' ago'}</span>
        </div>
      </FlexRow>
      <div>
        {c.content}
      </div>
    </FlexColumn>
  );
}

export function CommentSection () {
  const likeButtonRef = useRef(null);
  const fileSlice = useSelector((state) => state.file);
  const user = useSelector(selectUser);

  if (fileSlice.file && fileSlice.file.comments) {
    const comments = fileSlice.file.comments.filter(comment => !comment.parentId);
    if (fileSlice.sortCommentsBy === 'likes') {
      comments.sort((a, b) => b.likeCount - a.likeCount);
    } else {
      comments.sort((a, b) => b.createdAt - a.createdAt);
    }
    const replies = fileSlice.file.comments.filter(comment => comment.parentId);

    return fileSlice.file && (
      <FlexColumn>
        <FlexColumn>
          {comments.map((c, i) =>
            <FlexColumn
              css={{ color: 'white' }}
              key={i}
            >
              <CommentInfo c={c}/>
              <ReplyComment replies={replies}likeButtonRef={likeButtonRef} commentId={c._id} initialLikeCount={c.likeCount} initialLiked={user && c.likes.some(l => l.username === user.username) }/>
            </FlexColumn>,
          )}
        </FlexColumn>
      </FlexColumn>
    );
  }
}
