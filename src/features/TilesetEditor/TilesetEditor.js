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
import { asyncDeleteFile, asyncGetFileToEdit, asyncPatchFile, clearTilesetEditorErrors, clearTilesetEditorStatus, selectTilesetEditorErrors, selectTilesetEditorPrimitives, selectTilesetEditorStatuses, selectTilesetFile, selectTilesetNewChanges, setTilesetEditorPrimitives } from './tilesetEditorSlice';
import { emitJoinRoom, emitLeaveRoom, onConnected } from '../User/userEditorSocketApi';

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
  const statuses = useSelector(selectTilesetEditorStatuses);
  const file = useSelector(selectTilesetFile);
  const primitives = useSelector(selectTilesetEditorPrimitives);
  const newChanges = useSelector(selectTilesetNewChanges);

  useEffect(() => {
    dispatch(asyncGetFileToEdit({ id }));
    emitJoinRoom({ fileId: id });
    onConnected(() => emitJoinRoom({ fileId: id }));

    return () => {
      emitLeaveRoom({ fileId: id });
    };
  }, []);

  useEffect(() => {
    if (file) {
      console.log(file);
    }
  }, [file]);

  let content;

  function setActiveTool (tool) {
    dispatch(setTilesetEditorPrimitives({ activeTool: tool }));
  }

  if (statuses && statuses.getFileToEdit !== 'rejected') {
    content = file && file.rootLayer && (
      <div css={tilesetEditorStyle}>
        <LeftSidebar
          file={file}
          activeTool={primitives.activeTool}
          asyncDeleteFile={asyncDeleteFile}
          asyncPatchFile={asyncPatchFile}
          clearFileErrors={clearTilesetEditorErrors}
          clearFileStatus={clearTilesetEditorStatus}
          selectFileErrors={selectTilesetEditorErrors}
          selectFileStatuses={selectTilesetEditorStatuses}
          setActiveTool={setActiveTool}
          showColorPicker={true}
          type={'tileset'}
        />
        <FilenameIndicator file={file} saving={newChanges.length > 0} />
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
