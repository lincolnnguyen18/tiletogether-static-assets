/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';

const selectMenuStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const selectInputStyle = css`
  & {
    height: 40px;
    padding: 0 8px;
    border-radius: 4px;
    box-sizing: border-box;
    border: 1px solid #ccc;
    background: #fff;
    
    option {
      color: black;
    }
  }
  
  &:focus {
    outline: 1px solid black;
  }
`;

export function SelectMenu ({ items, onSelect, style, label, error, ...props }) {
  const id = _.uniqueId('textfield-');
  return (
    <div css={[selectMenuStyle, style]}>
      <label htmlFor={id}>{label}</label>
      <select css={selectInputStyle} onChange={onSelect} {...props} id={id}>
        {Object.keys(items).map((key, index) => (
          <option key={index} value={items[key]}>{key}</option>
        ))}
      </select>
      {error && (
        <span css={css`color: var(--error-color);`}>
          {error}
        </span>
      )}
    </div>
  );
}
