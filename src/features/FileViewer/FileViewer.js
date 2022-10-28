/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { Navbar } from '../Dashboard/Navbar/Navbar';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '../../components/inputs/Button';
import { useDispatch, useSelector } from 'react-redux';
import { getFileToView } from '../File/fileSlice';

const fileViewerStyle = css`
  background: red;
`;

export function FileViewer () {
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const pathname = location.pathname;
  const fileSlice = useSelector((state) => state.file);
  const userSlice = useSelector((state) => state.user);
  const file = fileSlice.file;
  const username = userSlice.primitives.user && userSlice.primitives.user.username;

  useEffect(() => {
    dispatch(getFileToView({ id }));
  }, []);

  return (
    <Fragment>
      <Navbar />
      {file && (
        <div css={fileViewerStyle}>
          <h1>File Viewer</h1>
          {file.authorUsername === username && (
            <Link to='edit'>
              <Button>Edit {pathname.split('/')[1].slice(0, -1)}</Button>
            </Link>
          )}
        </div>
      )}
    </Fragment>
  );
}
