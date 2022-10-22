/** @jsx jsx */
import { jsx } from '@emotion/react';
import { Textfield, whiteInputStyle } from '../../../components/Textfield';
import { setModalPrimitives, setModalReactElements } from '../../../components/Modal/modalSlice';
import { modalBodyStyle, modalheaderStyle } from '../../../components/Modal/Modal';
import { Icon } from '../../../components/Icon';
import { Badge } from '../../../components/Badge';
import { blackButtonStyle, Button } from '../../../components/Button';

export function openNewFileModal (dispatch, type) {
  dispatch(setModalReactElements({
    header: <NewFileModalHeader type={type} />,
    children: <NewFileModalBody type={type} />,
  }));
  dispatch(setModalPrimitives({
    open: true,
  }));
}

export function NewFileModalHeader ({ type }) {
  let title;
  switch (type) {
    case 'tileset':
      title = 'Create a new tileset';
      break;
    case 'map':
      title = 'Create a new map';
      break;
    default:
      throw new Error('Invalid new file modal type', type);
  }
  return (
    <div css={modalheaderStyle}>
      <h1>{title}</h1>
      <Badge
        color='white'
        backgroundColor={`var(--${type}-color)`}
        size={30}
        iconSize={30}
      >
        <Icon>
          <span className={`icon-${type}`} />
        </Icon>
      </Badge>
    </div>
  );
}

export function NewFileModalBody ({ type }) {
  async function onNewFile (formData) {
    console.log(formData, type);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target));
        onNewFile(formData);
      }}
      css={modalBodyStyle}
      noValidate
    >
      <Textfield
        label={type === 'tileset' ? 'Tileset name' : 'Map name'}
        type='text'
        autoFocus
        style={whiteInputStyle}
        name='name'
      />
      <Textfield
        label='Tile dimension (width and height of a tile in pixels)'
        type='number'
        style={whiteInputStyle}
        name='tiledimension'
      />
      <Textfield
        label={`Width (width of ${type} in number of tiles)`}
        type='number'
        style={whiteInputStyle}
        name='width'
      />
      <Textfield
        label={`Height (width of ${type} in number of tiles)`}
        type='number'
        style={whiteInputStyle}
        name='height'
      />
      <Button style={blackButtonStyle}>
        <span>Create {type}</span>
      </Button>
    </form>
  );
}
