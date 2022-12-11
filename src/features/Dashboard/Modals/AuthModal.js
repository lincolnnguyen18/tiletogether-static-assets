/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { setModalPrimitives, setModalReactElements } from '../../../components/Modal/modalSlice';
import { Textfield, whiteInputStyle } from '../../../components/inputs/Textfield';
import { blackButtonStyle, Button } from '../../../components/inputs/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { asyncGetUser, asyncPostUser, asyncResetPassword, asyncSendEmail, selectUserStatuses } from '../../User/userSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import { modalBodyStyle } from '../../../components/Modal/Modal';
import { asyncGetFiles } from '../../File/fileSlice';
import { FlexColumn } from '../../../components/layout/FlexColumn';
import _ from 'lodash';

const emailExpirationTimer = 60; // in seconds
let emailTimerHandle;

export function openAuthModal (dispatch, type) {
  dispatch(setModalReactElements({
    header: <AuthModalHeader type={type} />,
    children: <AuthModalBody type={type} />,
  }));
  dispatch(setModalPrimitives({
    open: true,
  }));
}

export function AuthModalHeader ({ type }) {
  switch (type) {
  case 'login':
    return <h1>Log in</h1>;
  case 'register':
    return <h1>Register an account</h1>;
  case 'email':
    return <h1>Enter email</h1>;
  case 'password':
    return <h1>Change Password</h1>;
  default:
    throw new Error('Invalid auth modal type', type);
  }
}

export function AuthModalBody ({ type }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const userStatuses = useSelector(selectUserStatuses);
  const formRef = useRef();

  useEffect(() => {
    setErrors({});
    formRef.current?.reset();
  }, [type]);

  const [errors, setErrors] = useState({});
  const [emailTimer, setEmailTimer] = useState(0);

  useEffect(() => {
    if (emailTimerHandle) clearInterval(emailTimerHandle);
    emailTimerHandle = setInterval(() => {
      if (emailTimer > 0) {
        setEmailTimer(emailTimer - 1);
      } else {
        clearInterval(emailTimerHandle);
      }
    }, 1000);
  }, [emailTimer]);

  const linkButtonStyle = css`
    text-align: center;
    color: blue;
    cursor: pointer;
    display: inline-block;
`;

  async function onRegister (formData) {
    const res = await dispatch(asyncPostUser(formData));

    if (res.type === asyncPostUser.rejected.type) {
      const errors = JSON.parse(res.error.message);
      setErrors(errors);
    } else {
      navigate('/');
    }
  }

  async function onLogin (formData) {
    const res = await dispatch(asyncGetUser(formData));

    if (res.type === asyncGetUser.rejected.type) {
      setErrors({ login: 'Invalid email or password' });
    } else {
      dispatch(setModalPrimitives({ open: false }));
      // reload files if user logs in
      dispatch(asyncGetFiles({ location }));
    }
  }

  async function onEmail (formData) {
    setEmailTimer(emailExpirationTimer);
    const res = await dispatch(asyncSendEmail(formData));

    if (res.type === asyncSendEmail.rejected.type) {
      const errors = JSON.parse(res.error.message);
      setErrors(errors);
    }

    return formData;
  }

  async function onChangePassword (formData) {
    const data = _.merge({ hash: location.pathname.split('/')[3] }, formData);

    const res = await dispatch(asyncResetPassword(data));
    if (res.type === asyncResetPassword.rejected.type) {
      const errors = JSON.parse(res.error.message);
      setErrors(errors);
    } else {
      openAuthModal(dispatch, 'login');
    }

    return formData;
  }
  return (
    <form css={modalBodyStyle} ref={formRef} onSubmit={(e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(e.target));
      switch (type) {
      case 'login':
        return onLogin(formData);
      case 'register':
        return onRegister(formData);
      case 'email':
        return onEmail(formData);
      case 'password':
        return onChangePassword(formData);
      default:
        throw new Error('Invalid auth modal type', type);
      }
    }} noValidate>
      { type !== 'password' && <Textfield
        placeholder='Enter your email'
        label='Email'
        type='email'
        autoFocus
        style={whiteInputStyle}
        name='email'
        error={errors.email}
      /> }
      {type === 'register' && (
        <Textfield
          placeholder='Enter your username'
          label='Username'
          type='username'
          style={whiteInputStyle}
          name='username'
          error={errors.username}
        />
      )}
      { (type === 'login' || type === 'register' || type === 'password') && <Textfield
        placeholder='Enter your password'
        label='Password'
        type='password'
        style={whiteInputStyle}
        name='password'
        error={errors.password}
      /> }
      {(type === 'register' || type === 'password') && (
        <Textfield
          placeholder='Confirm your password'
          label='Confirm password'
          type='password'
          style={whiteInputStyle}
          name='confirmPassword'
          error={errors.confirmPassword}
        />)
      }
      {errors.login && (
        <span css={css`color: red;`}>{errors.login}</span>
      )}

      <Button
        style={blackButtonStyle}
        disabled={userStatuses.postUser === 'pending' || userStatuses.getUser === 'pending' || emailTimer > 0 || userStatuses.sendemail === 'pending' || userStatuses.password === 'pending'}
      >
        {type === 'login' && <span>Login</span>}
        {type === 'register' && <span>Register</span>}
        {type === 'email' && <span>{emailTimer > 0 ? `Sent Email (${emailTimer})` : 'Send Email'}</span>}
        {type === 'password' && <span>Change Password</span>}

      </Button>
      {type === 'register' &&
        <div>Already have an account? <span css={linkButtonStyle } onClick={() => openAuthModal(dispatch, 'login')}>Login</span>
        </div>
      }
      {type === 'login' &&
        <FlexColumn gap={4}>
          <div>
            <span css={linkButtonStyle} onClick={() => openAuthModal(dispatch, 'email')}>Forgot Password?</span>
          </div>
          <div>No account? <span css={linkButtonStyle} onClick={() => openAuthModal(dispatch, 'register')}>Create one</span>
          </div>
        </FlexColumn>
      }
      {type === 'email' &&
        <div>Remember Your Password? <span css={linkButtonStyle} onClick={() => openAuthModal(dispatch, 'login')}>Login</span>
        </div>
      }
    </form>
  );
}
