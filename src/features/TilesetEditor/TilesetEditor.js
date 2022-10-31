/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { LeftSidebar } from '../Editor/LeftSidebar';
import { FilenameIndicator } from '../Editor/FilenameIndicator';
import { NotFound } from '../Editor/NotFound';
import { RightSidebar } from './RightSidebar';
import { TilesetCanvas } from './TilesetCanvas';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFileToEdit } from './tilesetEditorSlice';

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
  const tilesetEditorSlice = useSelector((state) => state.tilesetEditor);
  const file = tilesetEditorSlice.file;
  const error = tilesetEditorSlice.errors.includes('getFileToEdit');

  useEffect(() => {
    dispatch(getFileToEdit({ id }));
  }, [id]);

  let content;

  if (!error) {
    content = file && file.rootLayer && (
      <div css={tilesetEditorStyle}>
        <LeftSidebar file={file} />
        <FilenameIndicator file={file} />
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
