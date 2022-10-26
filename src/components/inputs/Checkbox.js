/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import _ from 'lodash';

const zoom = 1.3;

const checkboxInputStyle = css`
  margin-top: 4px;
  margin-bottom: 4px;
  zoom: ${zoom};
  transform: scale(${zoom});
  -ms-transform: scale(${zoom});
  transform-origin: 0 0;
  -webkit-transform-origin: 0 0;
`;

export function Checkbox ({ style, label, ...props }) {
  const id = _.uniqueId('checkbox-');
  return (
    <div css={css`display: flex; align-items: center; gap: 12px;`}>
      <label htmlFor={id}>{label}</label>
      <input
        css={[checkboxInputStyle, style]}
        type='checkbox'
        id={id}
        {...props}
      />
    </div>
  );
}
