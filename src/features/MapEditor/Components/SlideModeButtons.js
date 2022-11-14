/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { IconButton } from 'src/components/inputs/IconButton';

const slideModeButtonsStyle = css`
  position: absolute;
  background: #3F3F3F;
  color: #D4D4D4;
  padding: 8px;
  border-radius: 4px;
  top: 18px;
  left: 80%;
  transform: translateX(-50%);
  user-select: none;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer
  pointer-events: none;
`;

export function SlideModeButtons ({ slideMode, onSwithMode }) {
  return (
    <div css={slideModeButtonsStyle}>
      <IconButton active={slideMode === 'Horizontal'} onClick={() => onSwithMode('Horizontal')}>
        <span className='icon-back'></span>
      </IconButton>
      <IconButton active={slideMode === 'Vertical'} onClick={() => onSwithMode('Vertical')}>
        <span className='icon-more'></span>
      </IconButton>
      <IconButton active={slideMode === 'Zoom'} onClick={() => onSwithMode('Zoom')}>
        <span className='icon-search'></span>
      </IconButton>
    </div>
  );
}
