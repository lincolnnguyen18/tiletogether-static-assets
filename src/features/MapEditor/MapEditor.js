/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LeftSidebar } from '../LeftSidebar/LeftSidebar';

const mapEditorStyle = css`
`;

export function MapEditor () {
  const { id } = useParams();

  useEffect(() => {
    console.log(id);
  }, []);

  return (
    <Fragment>
      <div css={mapEditorStyle}>
        <LeftSidebar type='map' />
      </div>
    </Fragment>
  );
}
