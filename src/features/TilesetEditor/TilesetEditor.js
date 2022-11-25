/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { LeftSidebar } from '../Editor/LeftSidebar';
import { FilenameIndicator } from '../Editor/FilenameIndicator';
import { NotFound } from '../Editor/NotFound';
import { RightSidebar } from './RightSidebar';
import { TilesetCanvas } from './TilesetCanvas';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { asyncDeleteFile, asyncGetFileToEdit, asyncPatchFile, clearFile, clearTilesetEditorErrors, clearTilesetEditorStatus, selectTilesetEditorErrors, selectTilesetEditorPrimitives, selectTilesetEditorStatuses, selectTilesetFile, selectTilesetNewChanges, setTilesetEditorPrimitives } from './tilesetEditorSlice';
import { emitJoinRoom, emitLeaveRoom, onConnected } from '../User/userEditorSocketApi';

const tilesetEditorStyle = css`
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

export function TilesetEditor ({ viewOnly }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const statuses = useSelector(selectTilesetEditorStatuses);
  const file = useSelector(selectTilesetFile);
  const primitives = useSelector(selectTilesetEditorPrimitives);
  const newChanges = useSelector(selectTilesetNewChanges);

  useEffect(() => {
    dispatch(asyncGetFileToEdit({ id }));

    if (!viewOnly) {
      emitJoinRoom({ fileId: id });
      onConnected(() => emitJoinRoom({ fileId: id }));

      return () => {
        emitLeaveRoom({ fileId: id });
        dispatch(clearFile());
      };
    } else {
      dispatch(setTilesetEditorPrimitives({ activeTool: 'select' }));

      return () => {
        dispatch(clearFile());
      };
    }
  }, []);

  // useEffect(() => {
  //   if (file) {
  //     console.log(file);
  //   }
  // }, [file]);

  // let content;
  const [content, setContent] = useState(null);

  function setActiveTool (tool) {
    dispatch(setTilesetEditorPrimitives({ activeTool: tool }));
  }

  useEffect(() => {
    if (statuses.getFileToEdit === 'fulfilled') {
      if (file && file.rootLayer && ((!viewOnly && file.hasEditAccess) || viewOnly)) {
        setContent(
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
              viewOnly={viewOnly}
            />
            <FilenameIndicator file={file} newChanges={newChanges} viewOnly={viewOnly} />
            <RightSidebar viewOnly={viewOnly} />
            <TilesetCanvas viewOnly={viewOnly} />
          </div>,
        );
      } else {
        setContent(
          <NotFound />,
        );
      }
    }
  }, [statuses.getFileToEdit, file, primitives.activeTool, newChanges]);

  return content;
}
