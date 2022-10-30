/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/Icon';

const logoButtonStyle = css`
  & {
    gap: 4px;
    
    display: flex;
    flex-direction: row;
    align-items: center;
    
    user-select: none;
    cursor: pointer;
    
    border: none;
    outline: none;
    background: none;
    color: var(--off-white);
  }
  
  &:focus-visible {
    outline: 2px solid var(--outline-color);
  }
  
  .text {
    font-weight: bold;
    font-size: 18px;
  }
`;

export function LogoButton () {
  return (
    <Link to='/' style={{ textDecoration: 'none' }}>
      <button css={logoButtonStyle}>
        <Icon>
          <span className='icon-logo'></span>
        </Icon>
        <span className='text'>TileTogether</span>
      </button>
    </Link>
  );
}
