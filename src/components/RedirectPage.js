/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const redirectPageStyle = css`
  color: white;
  width: 100%;
  padding-top: 140px;
  padding-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
`;

const buttonsStyle = css`
  display: flex;
  gap: 24px;
`;

const messageStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 350px;
  text-align: center; 
`;

export function RedirectPage ({ icon, title, message, children }) {
  return (
    <div css={redirectPageStyle}>
      {icon}
      <div css={messageStyle}>
        <h1>{title}</h1>
        <span>{message}</span>
      </div>
      <div css={buttonsStyle}>
        {children}
      </div>
    </div>
  );
}
