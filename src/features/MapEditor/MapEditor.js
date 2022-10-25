/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LeftSidebar } from '../Editor/LeftSidebar';
import { useDispatch, useSelector } from 'react-redux';
import { FilenameIndicator } from '../Editor/FilenameIndicator';
import { getFileToEdit } from '../File/fileSlice';
import { NotFound } from '../Editor/NotFound';

const mapEditorStyle = css`
`;

export function MapEditor () {
  const { id } = useParams();
  const dispatch = useDispatch();
  const fileSlice = useSelector((state) => state.file);
  const error = fileSlice.errors.includes('getFileToEdit');

  useEffect(() => {
    dispatch(getFileToEdit({ id }));
  }, []);

  let content;

  if (!error) {
    content = (
      <div css={mapEditorStyle}>
        <LeftSidebar />
        <FilenameIndicator />
      </div>
    );
  } else {
    content = (
      <NotFound />
    );
  }

  return content;
}
