/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';

const textfieldInputStyle = css`
  margin-top: 4px;
  margin-bottom: 4px;
`;

const errorTextfieldInputStyle = css`
  &, &:focus {
    outline: 1px solid var(--error-color);
  }
`;

const textareaInputStyle = css`
  resize: none;
  height: 100px;
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

export function Textfield ({ placeholder = 'Enter a value', style, label, error, ...props }) {
  const id = _.uniqueId('textfield-');
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        css={[inputStyle, textfieldInputStyle, style, error && errorTextfieldInputStyle]}
        type='text'
        id={id}
        {...props}
        placeholder={placeholder}
      />
      {error && (
        <span css={css`color: var(--error-color);`}>
          {error}
        </span>
      )}
    </div>
  );
}

export function Textarea ({ placeholder = 'Enter a value', style, label, error, ...props }) {
  const id = _.uniqueId('textarea-');
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <textarea
        css={[inputStyle, textfieldInputStyle, textareaInputStyle, style, error && errorTextfieldInputStyle]}
        id={id}
        {...props}
        placeholder={placeholder}
      />
      {error && (
        <span css={css`color: var(--error-color);`}>
          {error}
        </span>
      )}
    </div>
  );
}
