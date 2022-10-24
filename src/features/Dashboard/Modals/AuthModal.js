/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { setModalPrimitives, setModalReactElements } from '../../../components/Modal/modalSlice';
import { Textfield, whiteInputStyle } from '../../../components/Textfield';
import { blackButtonStyle, Button } from '../../../components/Button';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { getUser, postUser } from '../../User/userSlice';
import { useNavigate } from 'react-router-dom';
import { modalBodyStyle } from '../../../components/Modal/Modal';

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
    default:
      throw new Error('Invalid auth modal type', type);
  }
}

export function AuthModalBody ({ type }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({});

  async function onRegister (formData) {
    const res = await dispatch(postUser(formData));

    if (res.type === postUser.rejected.type) {
      const errors = JSON.parse(res.error.message);
      setErrors(errors);
    } else {
      navigate('/');
    }
  }

  async function onLogin (formData) {
    const res = await dispatch(getUser(formData));

    if (res.type === getUser.rejected.type) {
      setErrors({ login: 'Invalid email or password' });
    } else {
      navigate('/');
    }
  }

  return (
    <form css={modalBodyStyle} onSubmit={(e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(e.target));
      switch (type) {
        case 'login':
          return onLogin(formData);
        case 'register':
          return onRegister(formData);
        default:
          throw new Error('Invalid auth modal type', type);
      }
    }} noValidate>
      <Textfield
        label='Email'
        type='email'
        autoFocus
        style={whiteInputStyle}
        name='email'
        error={errors.email}
      />
      {type === 'register' && (
        <Textfield
          label='Username'
          type='username'
          style={whiteInputStyle}
          name='username'
          error={errors.username}
        />
      )}
      <Textfield
        label='Password'
        type='password'
        style={whiteInputStyle}
        name='password'
        error={errors.password}
      />
      {type === 'register' && (
        <Textfield
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
      <Button style={blackButtonStyle}>
        <span>{type === 'login' ? 'Login' : 'Register'}</span>
      </Button>
    </form>
  );
}