import React, { Fragment, useEffect } from 'react';
import { Dashboard } from './features/Dashboard/Dashboard';
import { Menu } from './components/Menu/Menu';
import { Modal } from './components/Modal/Modal';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { asyncGetUser } from './features/User/userSlice';
import { apiClient } from './app/apiClient';
import { FileViewer } from './features/FileViewer/FileViewer';
import { TilesetEditor } from './features/TilesetEditor/TilesetEditor';
import { MapEditor } from './features/MapEditor/MapEditor';

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
    apiClient.get('/health').then((_) => {
      // console.log(response);
    }, (error) => {
      console.log(error);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      dispatch(asyncGetUser());
    }
  }, [user]);

  return (
    <Fragment>
      <Menu />
      <Modal />
      <Routes>
        {['/', '/search', '/likes', '/your-files', '/shared-files', '/register', '/login', '/users/:username'].map((path, index) => (
          <Route
            exact path={path}
            element={<Dashboard/>}
            key={index}
          />
        ))}
        {['/tilesets/:id', '/maps/:id'].map((path, index) => (
          <Route
            exact path={path}
            element={<FileViewer/>}
            key={index}
          />
        ))}
        <Route
          exact path = '/tilesets/:id/edit'
          element={<TilesetEditor/>}
        />
        <Route
          exact path = '/maps/:id/edit'
          element={<MapEditor/>}
        />
        <Route path="*" element={<Redirect to="/"/>}/>
      </Routes>
    </Fragment>
  );
}

export default App;
