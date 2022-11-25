/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const filenameIndicatorStyle = css`
  position: absolute;
  background: #3F3F3F;
  color: #D4D4D4;
  padding: 0 8px;
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

export function FilenameIndicator ({ file, newChanges, viewOnly }) {
  const hasChanges = newChanges && Object.keys(newChanges).length > 0;

  const savedIconStyle = css`
    font-size: 28px;
    color: ${hasChanges ? '#a6a6a6' : '#2dc25d'};
  `;

  const mode = viewOnly ? 'Viewing' : 'Editing';

  return (
    <div css={filenameIndicatorStyle}>
      <span className='text'>{`${mode} ${file.type} "${file.name}"`}</span>
      {!viewOnly && <span className='icon-check2' css={savedIconStyle} />}
    </div>
  );
}
