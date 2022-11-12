/** @jsx jsx */
import { jsx } from '@emotion/react';
import { useState } from 'react';
import { AddComment } from './AddComment';
import { FlexColumn } from '../../components/layout/FlexColumn';
import { FlexRow } from '../../components/layout/FlexRow';
import { IconButtonStyle, likeButtonStyle } from '../../components/inputs/Button';

export function ReplyComment ({
  commentId, likeButtonRef, replies,
}) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  return (
    <FlexColumn>
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
            <button css={[IconButtonStyle, { marginLeft: '3px' }]} onClick={() => setReplying(!replying)}>Reply</button>

        </FlexRow>
    <FlexColumn>
    {replying && <AddComment parentId={commentId} setReplying={setReplying}/>}
    </FlexColumn>
       <div onClick={() => { setShowReplies(true); }}css={{ color: '#4894f9' }}>{'View ' + replies.filter(reply => reply.parentId === commentId).length + ' replies'}</div>
        {showReplies && replies.filter(reply => reply.parentId === commentId).map((r, i) =>
        <div key={i}>{r.username}</div>)}
    </FlexColumn>

  );
}
