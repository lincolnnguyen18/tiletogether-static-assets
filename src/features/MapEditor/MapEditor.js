/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LeftSidebar } from '../Editor/LeftSidebar';
import { useDispatch, useSelector } from 'react-redux';
import { FilenameIndicator } from '../Editor/FilenameIndicator';
import { NotFound } from '../Editor/NotFound';
import { RightSidebar } from './RightSidebar';
import { asyncDeleteFile, asyncGetFileToEdit, asyncPatchFile, clearMapEditorErrors, clearMapEditorStatus, selectMapEditorErrors, selectMapEditorPrimitives, selectMapEditorStatuses, selectMapFile, selectMapNewChanges, setMapEditorPrimitives } from './mapEditorSlice';
import { MapCanvas } from './MapCanvas';
import { emitJoinRoom, emitLeaveRoom, onConnected } from '../User/userEditorSocketApi';

const mapEditorStyle = css`
`;

export function MapEditor () {
  const { id } = useParams();
  const dispatch = useDispatch();
  const file = useSelector(selectMapFile);
  const primitives = useSelector(selectMapEditorPrimitives);
  const statuses = useSelector(selectMapEditorStatuses);
  const newChanges = useSelector(selectMapNewChanges);

  useEffect(() => {
    dispatch(asyncGetFileToEdit({ id }));

    emitJoinRoom({ fileId: id });
    onConnected(() => emitJoinRoom({ fileId: id }));

    return () => {
      emitLeaveRoom({ fileId: id });
    };
  }, []);

  // useEffect(() => {
  //   if (file) {
  //     console.log(file);
  //   }
  // }, [file]);

  let content;

  function setActiveTool (tool) {
    dispatch(setMapEditorPrimitives({ activeTool: tool }));
  }

  if (statuses.getFileToEdit !== 'rejected') {
    content = file && file.rootLayer && (
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
        />
        <FilenameIndicator file={file} newChanges={newChanges} />
        <RightSidebar />
        <MapCanvas />
      </div>
    );
  } else {
    content = (
      <NotFound />
    );
  }

  return content;
}
