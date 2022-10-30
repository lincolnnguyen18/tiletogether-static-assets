/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { LeftSidebar } from '../Editor/LeftSidebar';
import { FilenameIndicator } from '../Editor/FilenameIndicator';
import { NotFound } from '../Editor/NotFound';
import { RightSidebar } from './RightSidebar';
import { TilesetCanvas } from './TilesetCanvas';
import { useEffect } from 'react';
import { getFileToEdit } from '../File/fileSlice';
import { useParams } from 'react-router-dom';

const tilesetEditorStyle = css`
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

export function TilesetEditor () {
  const { id } = useParams();
  const dispatch = useDispatch();
  const fileSlice = useSelector((state) => state.file);
  const file = fileSlice.file;
  const error = fileSlice.errors.includes('getFileToEdit');

  useEffect(() => {
    dispatch(getFileToEdit({ id }));
  }, [id]);

  let content;

  if (!error) {
    content = file && file.rootLayer && (
      <div css={tilesetEditorStyle}>
        <LeftSidebar />
        <FilenameIndicator />
        <RightSidebar />
        <TilesetCanvas />
      </div>
    );
  } else {
    content = (
      <NotFound />
    );
  }

  return content;
}
