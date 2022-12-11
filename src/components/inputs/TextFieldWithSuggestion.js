/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';
import { useState } from 'react';

const textfieldInputStyle = css`
  margin-top: 4px;
  margin-bottom: 4px;
`;

const errorTextfieldInputStyle = css`
  &, &:focus {
    outline: 1px solid var(--error-color);
  }
`;

export const inputStyle = css`
  transition: background 0.3s ease;
  outline: none;
  box-sizing: border-box;

  border-radius: 4px;
  padding: 10px;
  font-size: 16px;
  height: 40px;
  width: 100%;
`;

export const whiteInputStyle = css`
  & {
    background: #f6f6f6;
    color: black;
    border: 1px solid #ccc;
  }
  
  &::placeholder {
    color: var(--placeholder-color);
  }

  &:focus {
    background: #fff;
    outline: 1px solid black;
  }
`;

const dropdownMenuStyle = css`
  position: absolute;
  padding: 10px;
  width: 80%;
  border: 1px solid #ccc;
  overflow: auto;
  max-height: 150px;
  background-color: #fff;=
`;

const dropdownItemStyle = css`
  padding: 5px;
  cursor: pointer;
  width: 100%;

  &:hover {
    background: #9fc3f870
  }
`;

export function TextfieldWithSuggestion ({ placeholder = 'Enter a value', style, label, error, files, ...props }) {
  const id = _.uniqueId('textfield-');

  const [shown, setShown] = useState(false);
  const [selected, setSelected] = useState(placeholder);

  const onSelectFile = (id) => {
    setSelected(id);
    setShown(false);
  };

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        css={[inputStyle, textfieldInputStyle, style, error && errorTextfieldInputStyle]}
        type='text'
        id={id}
        onFocus={(_) => setShown(true)}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        {...props}
      />
      {shown && files && files.length > 0 && (
        <div css={dropdownMenuStyle}>
          {files.map(f => (
            <div key={`userfile-${f._id}`} css={dropdownItemStyle} onClick={(_) => { onSelectFile(f._id); } }>
              {f.name}
            </div>
          ))}
        </div>
      )}
      {error && (
        <span css={css`color: var(--error-color);`}>
          {error}
        </span>
      )}
    </div>
  );
}
