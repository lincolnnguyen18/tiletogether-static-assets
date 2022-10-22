import { Fragment, useRef } from 'react';
import { Button, transparentButtonStyle, whiteButtonStyle } from '../../../components/Button';
import { IconButton } from '../../../components/IconButton';
/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import { menuItemStyle, openMenu } from '../../../components/Menu/Menu';
import { Icon } from '../../../components/Icon';
import { Badge } from '../../../components/Badge';
import { openAuthModal } from '../Modals/AuthModal';
import { logout } from '../../User/userSlice';
import { useNavigate } from 'react-router-dom';
import { openNewFileModal } from '../Modals/NewFileModal';

const rightSectionStyle = css`
  flex-shrink: 0;
  gap: 16px;
`;

export function RightSection () {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userSlice = useSelector((state) => state.user);
  const menuSlice = useSelector((state) => state.menu);
  const menu = menuSlice.menu;

  const newFileButtons = [
    {
      icon: 'icon-tileset',
      backgroundColor: 'var(--tileset-color)',
      onClick: () => openNewFileModal(dispatch, 'tileset'),
      text: 'New tileset file',
    },
    {
      icon: 'icon-map',
      backgroundColor: 'var(--map-color)',
      onClick: () => openNewFileModal(dispatch, 'map'),
      text: 'New map file',
    },
  ];

  const avatarButtonRef = useRef(null);
  const newFileButtonRef = useRef(null);

  function onAvatarClick () {
    const rect = avatarButtonRef.current.getBoundingClientRect();
    const pos = {
      x: rect.right - menu.width,
      y: rect.y + rect.height + 5,
    };

    openMenu(dispatch, pos, (
      <button
        css={menuItemStyle}
        autoFocus
        onClick={() => dispatch(logout({ navigate }))}
      >
        <Icon color='black'>
          <span className='icon-logout' />
        </Icon>
        <span>Log out</span>
      </button>
    ));
  }

  const newFileMenuItemStyle = css`
    gap: 8px;
    padding-left: 8px;
  `;

  function onNewFileClick () {
    const rect = newFileButtonRef.current.getBoundingClientRect();
    const pos = {
      x: rect.right - menu.width + 3,
      y: rect.y + rect.height + 8,
    };

    openMenu(dispatch, pos, (
      <Fragment>
        {newFileButtons.map((button, index) => (
          <button
            css={[menuItemStyle, newFileMenuItemStyle]}
            onClick={button.onClick}
            key={index}
            autoFocus={index === 0}
          >
            <Badge
              backgroundColor={button.backgroundColor}
              color='white'
              size={32}
              iconSize={32}
            >
              <Icon>
                <span className={button.icon} />
              </Icon>
            </Badge>
            <span>{button.text}</span>
          </button>
        ))}
      </Fragment>
    ));
  }

  let rightSection;
  if (userSlice.primitives.user) {
    rightSection = (
      <Fragment>
        <Button
          style={whiteButtonStyle}
          refProp={newFileButtonRef}
          onClick={onNewFileClick}
          padding='2px 4px 2px 12px'
        >
          <span>New file</span>
          <span className='icon-plus' css={{ fontSize: 32 }}></span>
        </Button>
        <IconButton
          size={42}
          onClick={onAvatarClick}
          refProp={avatarButtonRef}
          style={css`padding: 2px 0 0 0;`}
        >
          <span className='icon-avatar'></span>
        </IconButton>
      </Fragment>
    );
  } else {
    rightSection = (
      <Fragment>
        <Button
          style={whiteButtonStyle}
          onClick={() => openAuthModal(dispatch, 'register')}
        >Register</Button>
        <Button
          style={transparentButtonStyle}
          onClick={() => openAuthModal(dispatch, 'login')}
        >Log in</Button>
      </Fragment>
    );
  }

  return (
    <div css={rightSectionStyle}>
      {rightSection}
    </div>
  );
}
