/** @jsx jsx */
import { jsx } from '@emotion/react';
import { FlexRow } from '../../components/layout/FlexRow';
import { FlexColumn } from '../../components/layout/FlexColumn';
import { useRef } from 'react';
import { IconButtonStyle, likeButtonStyle } from '../../components/inputs/Button';
import { useSelector } from 'react-redux';
import { timeAgo } from '../../utils/timeUtils';

export function CommentSection () {
  const likeButtonRef = useRef(null);
  const fileSlice = useSelector((state) => state.file);

  if (fileSlice.file && fileSlice.file.comments) {
    const comments = fileSlice.file.comments;

    return fileSlice.file && (
      <FlexColumn>
        <FlexColumn>
          {comments.map((c, i) =>
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
                  <span>{timeAgo(new Date(c.createdAt)) + ' ago'}</span>
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
}
