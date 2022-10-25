/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LeftSidebar } from '../Editor/LeftSidebar';
import { getFile } from '../File/fileSlice';
import { useDispatch } from 'react-redux';
import { FilenameIndicator } from '../Editor/FilenameIndicator';

const mapEditorStyle = css`
`;

export function MapEditor () {
  const { id } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log(id);
    dispatch(getFile({ id }));
  }, []);

  return (
    <Fragment>
      <div css={mapEditorStyle}>
        <LeftSidebar />
        <FilenameIndicator />
      </div>
    </Fragment>
  );
}
