/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';

const mapEditorStyle = css`
  background: red;
`;

export function MapEditor () {
  const { id } = useParams();

  useEffect(() => {
    console.log(id);
  }, []);

  return (
    <Fragment>
      <div css={mapEditorStyle}>
        <h1>Map Editor</h1>
        <Link to='/'>
          <Button>Go home</Button>
        </Link>
      </div>
    </Fragment>
  );
}
