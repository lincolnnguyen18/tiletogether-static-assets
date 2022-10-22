/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Button, transparentButtonStyle, whiteButtonStyle } from './Button';
import { openAuthModal } from '../features/Dashboard/Modals/AuthModal';
import { useDispatch } from 'react-redux';

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
`;

export function RedirectPage ({ icon, title, message }) {
  const dispatch = useDispatch();

  return (
    <div css={redirectPageStyle}>
      {icon}
      <div css={messageStyle}>
        <h1>{title}</h1>
        <span>{message}</span>
      </div>
      <div css={buttonsStyle}>
        <Button
          style={whiteButtonStyle}
          onClick={() => openAuthModal(dispatch, 'register')}
        >Register</Button>
        <Button
          style={transparentButtonStyle}
          onClick={() => openAuthModal(dispatch, 'login')}
        >Log in</Button>
      </div>
    </div>
  );
}
