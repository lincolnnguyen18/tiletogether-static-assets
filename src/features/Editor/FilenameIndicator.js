/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const filenameIndicatorStyle = css`
  position: absolute;
  background: #3F3F3F;
  color: #D4D4D4;
  padding-left: 8px;
  border-radius: 4px;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  user-select: none;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  
  .text {
    padding: 8px 0;
  }
`;

export function FilenameIndicator ({ file, newChanges }) {
  const hasChanges = newChanges && Object.keys(newChanges).length > 0;

  const savedIconStyle = css`
    font-size: 28px;
    padding-right: 4px;
    color: ${hasChanges ? '#a6a6a6' : '#2dc25d'};
  `;

  return (
    <div css={filenameIndicatorStyle}>
      <span className='text'>{`Editing ${file.type} "${file.name}"`}</span>
      <span className='icon-check2' css={savedIconStyle} />
    </div>
  );
}
