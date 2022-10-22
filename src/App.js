import React, { Fragment, useEffect } from 'react';
import { Dashboard } from './features/Dashboard/Dashboard';
import { Menu } from './components/Menu/Menu';
import { Modal } from './components/Modal/Modal';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUser } from './features/User/userSlice';
import { apiClient } from './app/apiClient';

export function Redirect ({ to }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  }, [to]);
  return null;
}

function App () {
  const dispatch = useDispatch();
  const userSlice = useSelector((state) => state.user);
  const user = userSlice.primitives.user;

  useEffect(() => {
    apiClient.get('/health').then((response) => {
      console.log(response);
    }, (error) => {
      console.log(error);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      dispatch(getUser());
    }
  }, [user]);

  return (
    <Fragment>
      <Menu />
      <Modal />
      <Routes>
        {['/', '/search', '/likes', '/your-files', '/shared-files', '/register', '/login'].map((path, index) => (
          <Route
            exact
            path={path}
            element={<Dashboard/>}
            key={index}
          />
        ))}
        <Route path="*" element={<Redirect to="/"/>}/>
      </Routes>
    </Fragment>
  );
}

export default App;
