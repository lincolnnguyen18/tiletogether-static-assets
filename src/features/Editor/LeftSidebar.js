/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { Fragment, useEffect } from 'react';
import { LeftSidebarDrawer } from './LeftSidebarDrawer';
import { setLeftSidebarPrimitives } from './leftSidebarSlice';
import { IconButton, notAllowedDisabledButtonStyle } from '../../components/inputs/IconButton';
import { Link, useNavigate } from 'react-router-dom';
import { SelectMenu } from '../../components/inputs/SelectMenu';
import { Button, grayButtonStyle, redButtonStyle } from '../../components/inputs/Button';
import { Icon } from '../../components/Icon';
import { Textfield, whiteInputStyle } from '../../components/inputs/Textfield';
import { Checkbox } from '../../components/inputs/Checkbox';
import _ from 'lodash';
import { defaultFlexColumnStyle, FlexColumn } from '../../components/layout/FlexColumn';
import { FlexRow } from '../../components/layout/FlexRow';
import { wait } from '../../utils/timeUtils';
import { selectTilesetEditorPrimitives, setTilesetEditorPrimitives } from '../TilesetEditor/tilesetEditorSlice';
import { downloadMapAsTmx } from '../MapEditor/mapEditorSlice';
import { openPublishModal } from '../../features/Dashboard/Modals/PublishModal';

const leftSidebarStyle = css`
  background: #3F3F3F;
  width: 54px;
  display: flex;
  height: 100%;
  position: absolute;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
  overflow-y: auto;
  padding: 48px 0;
  box-sizing: border-box;
  
  .group {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
`;

export function LeftSidebar ({ file, activeTool, asyncDeleteFile, asyncPatchFile, clearFileErrors, clearFileStatus, selectFileErrors, selectFileStatuses, setActiveTool, type }) {
  const dispatch = useDispatch();
  const leftSidebarSlice = useSelector((state) => state.leftSidebar);
  const showGrid = leftSidebarSlice.primitives.showGrid;
  const drawerOpen = leftSidebarSlice.primitives.drawerOpen;
  const drawerPage = leftSidebarSlice.primitives.drawerPage;
  const tilesetEditorPrimitives = useSelector(selectTilesetEditorPrimitives);
  const { downloadFormat, reuploadingFileImage } = tilesetEditorPrimitives;
  const statuses = useSelector(selectFileStatuses);
  const errors = useSelector(selectFileErrors);
  const navigate = useNavigate();
  const patchingPending = statuses.patchFile === 'pending';

  useEffect(() => {
    dispatch(setLeftSidebarPrimitives({ drawerOpen: false }));
  }, []);

  function openDrawer (page) {
    dispatch(setLeftSidebarPrimitives({ drawerOpen: true, drawerPage: page }));
  }

  async function closeDrawer () {
    dispatch(setLeftSidebarPrimitives({ drawerOpen: false }));
  }

  const downloadItems = { PNG: 'png' };
  if (type === 'map') {
    downloadItems['Tiled XML (.tmx)'] = 'tmx';
  }

  const downloadPage = (
    <Fragment>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = Object.fromEntries(new FormData(e.target));
          if (type === 'tileset') {
            dispatch(setTilesetEditorPrimitives({ downloadFormat: formData.type }));
          } else if (type === 'map') {
            if (formData.type === 'tmx') {
              dispatch(downloadMapAsTmx());
            } else if (formData.type === 'png') {
              console.log('download png');
            }
          }
        }}
        css={defaultFlexColumnStyle}
      >
        <SelectMenu
          label='Download file as'
          items={downloadItems}
          name='type'
          defaultValue='tmx'
        />
        <Button
          style={grayButtonStyle}
          type={'submit'}
          disabled={downloadFormat != null}
        >Download</Button>
      </form>
    </Fragment>
  );

  const copyLinkStyle = css`
    background: white;
    color: black;
    display: flex;
    justify-content: space-between;
    border-radius: 4px;
    align-items: center;
    padding-left: 12px;
    cursor: pointer;
    user-select: none;

    // truncate span to ellipsis with width of 270px
    span {
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 215px;
    }
  `;

  const editTextStyle = css`
    // truncate span to ellipsis with width of 270px
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 215px;
  `;

  const sharedWithStyle = css`
    div {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header {
      margin-bottom: 4px;
    }
  `;

  const sharePage = (
    <Fragment>
      <FlexColumn gap={4}>
        <span>Sharing URL</span>
        <div css={copyLinkStyle}>
        <span className='link-container'>
          https://www.tiletogether.com/files/t4Kmfkh4QYEaB8iuXhTmFA/edit
        </span>
          <Icon color='black'>
            <span className='icon-copy'></span>
          </Icon>
        </div>
      </FlexColumn>
      <span>Users added to the list below can view and edit this file using the URL above.</span>
      <div css={sharedWithStyle}>
        <div className='header'>
          <h4>Currently shared with</h4>
          <IconButton
            onClick={async () => {
              await wait(170);
              dispatch(setLeftSidebarPrimitives({ drawerPage: 'sharedWith' }));
            }}
            disabled={patchingPending}
          >
            <span className='icon-plus'></span>
          </IconButton>
        </div>
        {file.sharedWith.map((user, index) => (
          <div key={index}>
            <span>{user}</span>
            <IconButton
              onClick={async () => {
                // wait 100 ms to show active white circle css effect
                await wait(100);
                const confirm = window.confirm(`Are you sure you want to unshare this file with ${user}?`);
                if (confirm) {
                  const sharedWith = file.sharedWith.filter((u) => u !== user);
                  dispatch(asyncPatchFile({ id: file.id, updates: { sharedWith } }));
                }
              }}
              disabled={patchingPending}
            >
              <span className='icon-trash'></span>
            </IconButton>
          </div>
        ))}
      </div>
    </Fragment>
  );

  let publishText;

  if (file.publishedAt) {
    const dateString = new Date(file.publishedAt).toLocaleDateString();
    publishText = `This ${file.type} was published on ${dateString}`;
  } else if (file) {
    publishText = `This ${file.type} is not published`;
  }

  const settingsPage = (
    <Fragment>
      <FlexColumn gap={4}>
        <span>{_.capitalize(file.type)} name</span>
        <FlexRow>
          <h4 css={editTextStyle}>{file.name}</h4>
        </FlexRow>
      </FlexColumn>
      <FlexColumn gap={4}>
        <span>Tile dimension</span>
        <h4>{file.tileDimension} px</h4>
      </FlexColumn>
      <FlexColumn gap={4}>
        <span>Width</span>
        <h4>{file.width} tiles</h4>
      </FlexColumn>
      <FlexColumn gap={4}>
        <span>Height</span>
        <h4>{file.height} tiles</h4>
      </FlexColumn>
      <Button
        style={[grayButtonStyle, css`width: fit-content;`]}
        onClick={async () => {
          await wait(170);
          dispatch(setLeftSidebarPrimitives({ drawerPage: 'editProperties' }));
        }}
        disabled={patchingPending}
      >
        Edit properties
      </Button>
      <Checkbox
        label='View tile grid'
        name='gridLines'
        checked={showGrid}
        onChange={(e) => dispatch(setLeftSidebarPrimitives({ showGrid: e.target.checked }))}
      />
      <h4>{publishText}</h4>
      <FlexRow gap={24}>
        {file.publishedAt
          ? <Button
          style={grayButtonStyle}
          onClick={() => {
            const newPublishedAt = file.publishedAt ? null : true;
            dispatch(asyncPatchFile({ id: file.id, updates: { publishedAt: newPublishedAt } }));
          }}
          disabled={patchingPending}
        >
         Unpublish
        </Button>
          : <Button
          style={grayButtonStyle}
          onClick={() => {
            closeDrawer();
            openPublishModal(dispatch, file.type, file);
          }}
          disabled={patchingPending}
        >
          {file.publishedAt
            ? 'Unpublish'
            : 'Publish'}
        </Button>}

        <Button
          style={redButtonStyle}
          disabled={patchingPending}
          onClick={() => {
            // use confirm alert to confirm delete
            const confirmed = window.confirm(`Are you sure you want to delete this ${file.type}?`);
            if (confirmed) {
              dispatch(asyncDeleteFile({ id: file.id }));
            }
          }}
        >
          Delete
        </Button>
      </FlexRow>
    </Fragment>
  );

  useEffect(() => {
    if (statuses.patchFile === 'fulfilled') {
      if (drawerPage === 'editProperties') {
        dispatch(setLeftSidebarPrimitives({ drawerPage: 'settings' }));
      } else if (drawerPage === 'sharedWith') {
        dispatch(setLeftSidebarPrimitives({ drawerPage: 'share' }));
      }
      dispatch(clearFileStatus({ status: 'patchFile' }));
    }
    if (statuses.deleteFile === 'fulfilled') {
      navigate('/your-files');
      dispatch(clearFileStatus({ status: 'deleteFile' }));
    }
  }, [statuses, errors]);

  useEffect(() => {
    dispatch(clearFileErrors());
  }, [drawerPage]);

  const editPropertiesPage = (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target));
        dispatch(asyncPatchFile({ id: file.id, updates: formData }));
        console.log(formData);
        if (formData.width !== file.width ||
          formData.height !== file.height ||
          formData.tileDimension !== file.tileDimension
        ) {
          // console.log('sending new file image');
          if (reuploadingFileImage) {
            // console.log('already reuploading file image');
            return;
          }
          dispatch(setTilesetEditorPrimitives({ fileImageChanged: true }));
        }
      }}
      css={defaultFlexColumnStyle}
    >
      <Textfield
        placeholder={`Type a name for your ${file.type}`}
        label={`${_.capitalize(file.type)} name`}
        type='text'
        style={whiteInputStyle}
        name='name'
        defaultValue={file.name}
        error={errors && errors.name}
      />
      {file && file.type === 'tileset'
        ? (
        <Textfield
          label='Tile dimension (width and height of a tile in pixels)'
          type='number'
          defaultValue={file.tileDimension}
          style={whiteInputStyle}
          name='tileDimension'
          error={errors && errors.tileDimension}
        />)
        : (
        <FlexColumn gap={4}>
          <span>Tile dimension</span>
          <h4>{file.tileDimension} px</h4>
        </FlexColumn>
          )}
      <Textfield
        label={`Width (width of ${file.type} in tiles)`}
        type='number'
        defaultValue={file.width}
        style={whiteInputStyle}
        name='width'
        error={errors && errors.width}
      />
      <Textfield
        label={`Height (height of ${file.type} in tiles)`}
        type='number'
        defaultValue={file.height}
        style={whiteInputStyle}
        name='height'
        error={errors && errors.height}
      />
      <Button
        style={[grayButtonStyle, { width: '100%' }]}
        type='submit'
        disabled={patchingPending}
      >Save changes</Button>
      <Button
        style={[redButtonStyle, { width: '100%' }]}
        onClick={async () => {
          await wait(100);
          dispatch(setLeftSidebarPrimitives({ drawerPage: 'settings' }));
        }}
        disabled={patchingPending}
        type='button'
      >Cancel</Button>
    </form>
  );

  const sharedWithPage = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target));
        // console.log(formData);
        const sharedWith = [...file.sharedWith, formData.username];
        dispatch(asyncPatchFile({ id: file.id, updates: { sharedWith } }));
      }}
      css={defaultFlexColumnStyle}
    >
      <Textfield
        placeholder='Enter a username'
        autoComplete='off'
        label='Share this file with a user'
        type='text'
        style={whiteInputStyle}
        name='username'
        defaultValue=''
        error={errors && errors.sharedWith}
        autoFocus
      />
      <Button
        style={grayButtonStyle}
        type='submit'
        disabled={patchingPending}
      >Add</Button>
      <Button
        style={redButtonStyle}
        onClick={() => dispatch(setLeftSidebarPrimitives({ drawerPage: 'share' }))}
        disabled={patchingPending}
      >Cancel</Button>
    </form>
  );

  const divider = (
    <div css={css`background: #5f5f5f;
      height: 5px;
      width: 100%;
      border-radius: 4px;`}></div>
  );

  let publishedPageButton;

  if (file.publishedAt) {
    publishedPageButton = (
      <Link to={`/${file.type}s/${file.id}`} title={`View published ${file.type}`} style={{ textDecoration: 'none' }}>
        <IconButton>
          <span className='icon-globe'></span>
        </IconButton>
      </Link>
    );
  } else {
    publishedPageButton = (
      <IconButton title='This file is not published' disabled style={notAllowedDisabledButtonStyle}>
        <span className='icon-globe'></span>
      </IconButton>
    );
  }

  return (
    <Fragment>
      <LeftSidebarDrawer
        open={drawerOpen}
        onClose={closeDrawer}
      >
        {drawerPage === 'download' && downloadPage}
        {drawerPage === 'share' && sharePage}
        {drawerPage === 'settings' && settingsPage}
        {drawerPage === 'editProperties' && editPropertiesPage}
        {drawerPage === 'sharedWith' && sharedWithPage}
      </LeftSidebarDrawer>
      <div css={leftSidebarStyle}>
        <div className='group'>
          <IconButton active={activeTool === 'draw' && !drawerOpen} onClick={() => setActiveTool('draw')}>
            <span className='icon-pencil'></span>
          </IconButton>
          <IconButton active={activeTool === 'erase' && !drawerOpen} onClick={() => setActiveTool('erase')}>
            <span className='icon-eraser'></span>
          </IconButton>
          <IconButton active={activeTool === 'select' && !drawerOpen} onClick={() => setActiveTool('select')}>
            <span className='icon-cursor'></span>
          </IconButton>
          {type === 'tileset' && (
            <IconButton active={activeTool === 'color-picker' && !drawerOpen} onClick={() => setActiveTool('color-picker')}>
              <span className='icon-color-picker'></span>
            </IconButton>
          )}
        </div>
        <div className='group'>
          <IconButton onClick={() => openDrawer('download')} title={`Download ${file.type}`}>
            <span className='icon-download'></span>
          </IconButton>
          <IconButton onClick={() => openDrawer('share')} title='Sharing settings'>
            <span className='icon-share'></span>
          </IconButton>
          <IconButton onClick={() => openDrawer('settings')} title={`${_.capitalize(file.type)} properties`}>
            <span className='icon-settings'></span>
          </IconButton>
          {divider}
          <Link to='/your-files' title='Go to your files' style={{ textDecoration: 'none' }}>
            <IconButton>
              <span className='icon-logo'></span>
            </IconButton>
          </Link>
          {publishedPageButton}
        </div>
      </div>
    </Fragment>
  );
}
