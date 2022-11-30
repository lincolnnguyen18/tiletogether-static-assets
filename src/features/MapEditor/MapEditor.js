/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LeftSidebar } from '../Editor/LeftSidebar';
import { useDispatch, useSelector } from 'react-redux';
import { FilenameIndicator } from '../Editor/FilenameIndicator';
import { NotFound } from '../Editor/NotFound';
import { RightSidebar } from './RightSidebar';
import { asyncDeleteFile, asyncGetFileToEdit, asyncPatchFile, clearFile, clearMapEditorErrors, clearMapEditorStatus, selectMapEditorErrors, selectMapEditorPrimitives, selectMapEditorStatuses, selectMapFile, selectMapNewChanges, setMapEditorPrimitives } from './mapEditorSlice';
import { MapCanvas } from './MapCanvas';
import { emitJoinRoom, emitLeaveRoom, onConnected } from '../User/userEditorSocketApi';

const mapEditorStyle = css`
`;

export function MapEditor ({ viewOnly }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const file = useSelector(selectMapFile);
  const primitives = useSelector(selectMapEditorPrimitives);
  const statuses = useSelector(selectMapEditorStatuses);
  const newChanges = useSelector(selectMapNewChanges);

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
      dispatch(setMapEditorPrimitives({ activeTool: 'select' }));

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
    dispatch(setMapEditorPrimitives({ activeTool: tool }));
  }

  useEffect(() => {
    // console.log('file', file);
    // console.log('statuses.getFileToEdit', statuses.getFileToEdit);
    if (statuses.getFileToEdit === 'fulfilled') {
      if (file && file.rootLayer && ((!viewOnly && file.hasEditAccess) || viewOnly)) {
        console.log('file', file);
        setContent(
          <div css={mapEditorStyle}>
            <LeftSidebar
              file={file}
              activeTool={primitives.activeTool}
              asyncDeleteFile={asyncDeleteFile}
              asyncPatchFile={asyncPatchFile}
              clearFileErrors={clearMapEditorErrors}
              clearFileStatus={clearMapEditorStatus}
              selectFileErrors={selectMapEditorErrors}
              selectFileStatuses={selectMapEditorStatuses}
              setActiveTool={setActiveTool}
              type={'map'}
              viewOnly={viewOnly}
            />
            <FilenameIndicator file={file} newChanges={newChanges} viewOnly={viewOnly} />
            <RightSidebar viewOnly={viewOnly} />
            <MapCanvas viewOnly={viewOnly} />
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
