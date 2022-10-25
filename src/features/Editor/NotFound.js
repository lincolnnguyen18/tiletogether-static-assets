import React, { Fragment } from 'react';
import { RedirectPage } from '../../components/RedirectPage';
import { Icon } from '../../components/Icon';
import { Button, whiteButtonStyle } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../Dashboard/Navbar/Navbar';

export function NotFound () {
  const navigate = useNavigate();

  return (
    <Fragment>
      <Navbar />
      <RedirectPage
        icon={(
          <Icon size={64} iconSize={90}>
            <span className='icon-file'></span>
          </Icon>
        )}
        title='File not found'
        message='The file you are trying to edit does not exist or you do not have permission to edit it.'
      >
        <Button
          style={whiteButtonStyle}
          onClick={() => navigate('/')}
        >Go back to home page</Button>
      </RedirectPage>
    </Fragment>
  );
}
