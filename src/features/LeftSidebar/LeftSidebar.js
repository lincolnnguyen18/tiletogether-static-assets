/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { Fragment } from 'react';
import { LeftSidebarDrawer } from './LeftSidebarDrawer';
import { setLeftSidebarPrimitives } from './LeftSidebarSlice';
import { IconButton } from '../../components/IconButton';
import { useNavigate, useParams } from 'react-router-dom';
import { SelectMenu } from '../../components/SelectMenu';
import { Button, whiteButtonStyle } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Textfield, whiteInputStyle } from '../../components/Textfield';
import { Checkbox } from '../../components/Checkbox';
import _ from 'lodash';

const leftSidebarStyle = css`
  background: #3F3F3F;
  width: 54px;
  display: flex;
  height: 100%;
  position: absolute;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  z-index: 3;
  
  .group {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 48px 0
  }
`;

export function LeftSidebar ({ type }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const leftSidebarSlice = useSelector((state) => state.leftSidebar);
  const drawerOpen = leftSidebarSlice.primitives.drawerOpen;
  const drawerPage = leftSidebarSlice.primitives.drawerPage;
  const { id } = useParams();

  function openDrawer (page) {
    dispatch(setLeftSidebarPrimitives({ drawerOpen: true, drawerPage: page }));
  }

  function closeDrawer () {
    dispatch(setLeftSidebarPrimitives({ drawerOpen: false }));
  }

  const downloadPage = (
    <Fragment>
      <SelectMenu
        label='Download file as'
        items={{ PNG: 'png', 'Tiled JSON (.tmj)': 'tmj' }}
        name='type'
        defaultValue='tmj'
      />
      <Button style={whiteButtonStyle}>Download</Button>
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
      <h4>Sharing URL</h4>
      <div css={copyLinkStyle}>
        <span className='link-container'>
          https://www.figma.com/file/t4Kmfkh4QYEaB8iuXhTmFA/CSE-416?node-id=261%3A2628
        </span>
        <Icon color='black'>
          <span className='icon-copy'></span>
        </Icon>
      </div>
      <span>Users added to the list below can view and edit this file using the URL above.</span>
      <div css={sharedWithStyle}>
        <div className='header'>
          <h4>Shared with</h4>
          <IconButton>
            <span className='icon-plus'></span>
          </IconButton>
        </div>
        {['anawesomeuser3', 'anawesomeuser4', 'anawesomeuser5'].map((user, index) => (
          <div key={index}>
            <span>{user}</span>
            <IconButton>
              <span className='icon-trash'></span>
            </IconButton>
          </div>
        ))}
      </div>
    </Fragment>
  );

  const settingsPage = (
    <Fragment>
      <Textfield
        placeholder={`Type a name for your ${type}`}
        label={`${_.capitalize(type)} name`}
        type='text'
        style={whiteInputStyle}
        name='name'
        defaultValue={'My awesome file'}
      />
      <Checkbox
        label='Grid lines'
        name='gridLines'
        defaultValue={true}
      />
      <h4>This {type} was published on 10/10/2021</h4>
      <div css={css`display: flex; gap: 16px; justify-content: flex-start;`}>
        <Button style={whiteButtonStyle}>Unpublish</Button>
        <Button style={[whiteButtonStyle, css`background: red !important; color: white !important;`]}>Delete</Button>
      </div>
    </Fragment>
  );

  const divider = (
    <div css={css`background: #5f5f5f;
      height: 5px;
      width: 100%;
      border-radius: 4px;`}></div>
  );

  return (
    <Fragment>
      <LeftSidebarDrawer
        open={drawerOpen}
        onClose={closeDrawer}
      >
        {drawerPage === 'download' && downloadPage}
        {drawerPage === 'share' && sharePage}
        {drawerPage === 'settings' && settingsPage}
      </LeftSidebarDrawer>
      <div css={leftSidebarStyle}>
        <div className='group'>
          <IconButton>
            <span className='icon-pencil'></span>
          </IconButton>
          <IconButton>
            <span className='icon-eraser'></span>
          </IconButton>
        </div>
        <div className='group'>
          <IconButton onClick={() => openDrawer('download')} title={`Download ${type}`}>
            <span className='icon-download'></span>
          </IconButton>
          <IconButton onClick={() => openDrawer('share')} title='Collaboration settings'>
            <span className='icon-share'></span>
          </IconButton>
          <IconButton onClick={() => openDrawer('settings')} title={`${_.capitalize(type)} properties`}>
            <span className='icon-settings'></span>
          </IconButton>
          {divider}
          <IconButton onClick={() => navigate('/your-files')} title='Go to your files'>
            <span className='icon-home'></span>
          </IconButton>
          <IconButton onClick={() => navigate(`/${type}s/${id}`)} title={`View published ${type}`}>
            <span className='icon-globe'></span>
          </IconButton>
        </div>
      </div>
    </Fragment>
  );
}
