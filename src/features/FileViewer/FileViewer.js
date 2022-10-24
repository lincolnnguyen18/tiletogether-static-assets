/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { Navbar } from '../Dashboard/Navbar/Navbar';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';

const fileViewerStyle = css`
  background: red;
`;

export function FileViewer () {
  const { id } = useParams();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    console.log(id);
  }, []);

  return (
    <Fragment>
      <Navbar />
      <div css={fileViewerStyle}>
        <h1>File Viewer</h1>
        <Link to='edit'>
          <Button>Edit {pathname.split('/')[1].slice(0, -1)}</Button>
        </Link>
      </div>
    </Fragment>
  );
}
