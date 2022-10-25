/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getFile } from '../File/fileSlice';
import { LeftSidebar } from '../LeftSidebar/LeftSidebar';
import { useParams } from 'react-router-dom';

const tilesetEditorStyle = css`
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
        <LeftSidebar type='tileset' />
      </div>
    </Fragment>
  );
}
