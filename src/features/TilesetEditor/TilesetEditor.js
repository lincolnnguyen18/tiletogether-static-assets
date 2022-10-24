/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { useDispatch } from 'react-redux';
import { getFile } from '../File/fileSlice';

const tilesetEditorStyle = css`
  background: red;
`;

export function TilesetEditor () {
  const { id } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log(id);
    dispatch(getFile({ id }));
  }, []);

  return (
    <Fragment>
      <div css={tilesetEditorStyle}>
        <h1>Tileset Editor</h1>
        <Link to='/'>
          <Button>Go home</Button>
        </Link>
      </div>
    </Fragment>
  );
}
