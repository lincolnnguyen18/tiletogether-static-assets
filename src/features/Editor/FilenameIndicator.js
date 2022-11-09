/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const filenameIndicatorStyle = css`
  position: absolute;
  background: #3F3F3F;
  color: #D4D4D4;
  padding: 8px;
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
`;

export function FilenameIndicator ({ file }) {
  return (
    <div css={filenameIndicatorStyle}>
      <span>{`Editing ${file.type} "${file.name}"`}</span>
    </div>
  );
}
