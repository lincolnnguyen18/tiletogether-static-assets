/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LeftSidebar } from '../Editor/LeftSidebar';
import { useDispatch, useSelector } from 'react-redux';
import { FilenameIndicator } from '../Editor/FilenameIndicator';
import { NotFound } from '../Editor/NotFound';
import { RightSidebar } from './RightSidebar';
import { getFileToEdit } from './mapEditorSlice';

const mapEditorStyle = css`
`;

export function MapEditor () {
  const { id } = useParams();
  const dispatch = useDispatch();
  const mapEditorSlice = useSelector((state) => state.mapEditor);
  const file = mapEditorSlice.file;
  const error = mapEditorSlice.errors.includes('getFileToEdit');

  useEffect(() => {
    dispatch(getFileToEdit({ id }));
  }, []);

  let content;

  if (!error) {
    content = file && file.rootLayer && (
      <div css={mapEditorStyle}>
        <LeftSidebar file={file} />
        <FilenameIndicator file={file} />
        <RightSidebar />
      </div>
    );
  } else {
    content = (
      <NotFound />
    );
  }

  return content;
}
