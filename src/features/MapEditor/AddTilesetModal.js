/** @jsx jsx */
import { css, Global, jsx } from '@emotion/react';
import { setModalPrimitives, setModalReactElements } from '../../components/Modal/modalSlice';
import { modalBodyStyle, modalheaderStyle } from '../../components/Modal/Modal';
import { Badge } from '../../components/Badge';
import { Icon } from '../../components/Icon';
import { Textfield, whiteInputStyle } from '../../components/inputs/Textfield';
import { blackButtonStyle, Button } from '../../components/inputs/Button';
import { FlexRow } from '../../components/layout/FlexRow';
import { useDispatch, useSelector } from 'react-redux';
import { asyncPatchFile, clearMapEditorErrors, selectMapEditorErrors, selectMapEditorStatuses, selectMapFile } from './mapEditorSlice';

export function openAddTilesetModal (dispatch) {
  dispatch(setModalReactElements({
    header: <AddTilesetModalHeader />,
    children: <AddTilesetModalBody />,
  }));
  dispatch(setModalPrimitives({
    open: true,
    clickOnBackdropToClose: false,
    closeOnEscape: true,
  }));
  dispatch(clearMapEditorErrors());
}

export function AddTilesetModalHeader () {
  return (
    <div css={modalheaderStyle}>
      <h1>Add a tileset</h1>
      <Badge
        color='white'
        backgroundColor={'var(--tileset-color)'}
        size={30}
        iconSize={30}
      >
        <Icon>
          <span className={'icon-tileset'} />
        </Icon>
      </Badge>
    </div>
  );
}

export function AddTilesetModalBody () {
  const dispatch = useDispatch();
  const file = useSelector(selectMapFile);
  const errors = useSelector(selectMapEditorErrors);
  const statuses = useSelector(selectMapEditorStatuses);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target));
        // console.log('onAddTileset', formData);
        const newTilesets = file.tilesets.concat({
          file: formData.id,
        });
        // console.log(newTilesets);
        const res = await dispatch(asyncPatchFile({ id: file.id, updates: { tilesets: newTilesets } }));
        // console.log('res', res);
        if (res.meta.requestStatus === 'fulfilled') {
          dispatch(setModalPrimitives({ open: false }));
        }
      }}
      css={modalBodyStyle}
      noValidate
    >
      <Global styles={css`#portal-root * { z-index: 2; }`} />
      <Textfield
        type='text'
        label={'Tileset ID'}
        autoFocus
        style={whiteInputStyle}
        error={errors.tilesets}
        name='id'
      />
      <FlexRow style={{ justifyContent: 'flex-end' }}>
        <Button
          style={[blackButtonStyle, css`width: fit-content;`]}
          type={'submit'}
          disabled={statuses.patchFile === 'pending'}
        >
          <span>{'Add tileset'}</span>
        </Button>
      </FlexRow>
    </form>
  );
}
