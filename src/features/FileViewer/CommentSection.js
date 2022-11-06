/** @jsx jsx */
import { jsx } from '@emotion/react';
import { FlexRow } from '../../components/Layouts/FlexRow';
import { FlexColumn } from '../../components/Layouts/FlexColumn';
import { TimeUtils } from '../../utils/timeUtils';
import { useRef } from 'react';
import { IconButtonStyle, likeButtonStyle } from '../../components/inputs/Button';

// eslint-disable-next-line no-unused-vars
export function CommentSection ({ comments }) {
  const likeButtonRef = useRef(null);
  const timeUtils = new TimeUtils();

  return (
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
