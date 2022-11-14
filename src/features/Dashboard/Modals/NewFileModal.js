/** @jsx jsx */
import { jsx } from '@emotion/react';
import { Textfield, whiteInputStyle } from '../../../components/inputs/Textfield';
import { setModalPrimitives, setModalReactElements } from '../../../components/Modal/modalSlice';
import { modalBodyStyle, modalheaderStyle } from '../../../components/Modal/Modal';
import { Icon } from '../../../components/Icon';
import { Badge } from '../../../components/Badge';
import { blackButtonStyle, Button } from '../../../components/inputs/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { asyncCreateFile, selectFileErrors, selectFileStatuses } from '../../File/fileSlice';

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const errors = useSelector(selectFileErrors);
  const statuses = useSelector(selectFileStatuses);
  const pending = statuses.createFile === 'pending';

  async function onNewFile (formData) {
    formData.type = type;
    const res = await dispatch(asyncCreateFile({ file: formData }));
    // console.log(res);
    if (res.type === asyncCreateFile.fulfilled.type) {
      const { fileId } = res.payload;
      dispatch(setModalPrimitives({ open: false }));
      navigate(`/${type}s/${fileId}/edit`);
    }
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
        error={errors.name}
        disabled={pending}
      />
      <Textfield
        label='Tile dimension (width and height of a tile in pixels)'
        type='number'
        style={whiteInputStyle}
        name='tileDimension'
        error={errors.tileDimension}
        defaultValue={16}
        disabled={pending}
      />
      <Textfield
        label={`Width (width of ${type} in tiles)`}
        type='number'
        style={whiteInputStyle}
        name='width'
        error={errors.width}
        defaultValue={30}
        disabled={pending}
      />
      <Textfield
        label={`Height (width of ${type} in tiles)`}
        type='number'
        style={whiteInputStyle}
        name='height'
        error={errors.height}
        defaultValue={42}
        disabled={pending}
      />
      <Button
        style={blackButtonStyle}
        disabled={pending}
      >
        <span>Create {type}</span>
      </Button>
    </form>
  );
}
