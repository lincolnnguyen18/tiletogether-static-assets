/** @jsx jsx */
import { jsx, css } from '@emotion/react';
import { useRef } from 'react';
import { Icon } from '../../../components/Icon';
import { inputStyle } from '../../../components/inputs/Textfield';
import { IconButton } from '../../../components/inputs/IconButton';

const searchbarStyle = css`
  & {
    background: var(--input-gray-background);
    border: 1px solid var(--input-gray-border);
    border-radius: 4px;
    width: 100%;
    display: block !important;
    position: relative;
  }
  
  &:focus-within {
    outline: 1px solid var(--outline-color);
  }
  
  & input {
    background: var(--input-gray-background);
    padding-left: 44px;
  }
`;

const searchInputStyle = css`
  & {
    background: none;
    border: none;
    color: var(--input-text-color);
    width: 100%;
  }
  
  &::placeholder {
    color: var(--placeholder-color-2);
  }
  
  &:focus {
    box-shadow: none;
    background: none;
  }
`;

const searchIconStyle = css`
  position: absolute;
  left: 2px
`;

const clearButtonStyle = css`
  position: absolute;
  right: 2px;
  top: 0;
  padding-top: 2px;
  padding-left: 1px;
`;

export function Searchbar ({ value, onChange, placeholder, onSubmit }) {
  const searchInputRef = useRef(null);

  return (
    <div css={searchbarStyle}>
      <Icon
        onClick={() => searchInputRef.current.focus()}
        style={searchIconStyle}
      >
        <span
          className='icon-search'
          css={css`color: var(--placeholder-color-2);`}
        ></span>
      </Icon>
      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit(value);
        }}
        css={css`width: 100%;`}
      >
        <input
          css={[inputStyle, searchInputStyle]}
          ref={searchInputRef}
          type='search'
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          id='searchbar'
        />
      </form>
      {value && (
        <IconButton onClick={() => onChange('')} style={clearButtonStyle}>
          <span className='icon-clear'></span>
        </IconButton>
      )}
    </div>
  );
}
